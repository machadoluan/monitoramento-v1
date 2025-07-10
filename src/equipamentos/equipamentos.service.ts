import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipamento } from './equipamentos.entity';
import { DeepPartial, In, Repository } from 'typeorm';
import * as Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as cheerio from 'cheerio';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { GeocodificacaoService } from './geocodificacao.service';

@Injectable()
export class EquipamentosService {
    constructor(
        @InjectRepository(Equipamento)
        private readonly repo: Repository<Equipamento>,
        private readonly geocodificacaoService: GeocodificacaoService,
    ) { }

    async registerOrUpdate(data: Partial<Equipamento>): Promise<Equipamento> {
        const nome = (data.nome || '').trim();
        const localidade = (data.localidade || '').trim();
        const ip = (data.ip || '').trim();

        const existente = await this.repo.findOne({
            where: { nome, localidade },
        });

        if (existente) {
            console.log(`🔄 Atualizando existente: ${nome}`);

            if (existente.apagado) {
                console.log(`🚫 Equipamento ${nome} está marcado como apagado. Ignorando e-mail.`);
                return existente;
            }

            if (data.ultimaAtualizacao) {
                existente.ultimaAtualizacao = data.ultimaAtualizacao;
            }

            existente.contato = data.contato || existente.contato;
            existente.status = 'online';
            return this.repo.save(existente);

        } else {
            console.log(`🆕 Criando novo equipamento:`, nome, ip, localidade);

            const novo: DeepPartial<Equipamento> = {
                nome,
                localidade,
                ip,
                contato: data.contato,
                status: 'online',
                ultimaAtualizacao: data.ultimaAtualizacao,
            };
            return this.repo.save(novo);
        }
    }

    async marcarOffline(id: number) {
        await this.repo.update(id, { status: 'offline' });
    }

    async marcarOnline(id: number) {
        await this.repo.update(id, { status: 'online' });
    }

    async findAll(): Promise<Equipamento[]> {
        return this.repo.find({ where: { apagado: false }, order: { nome: 'ASC' } });
    }

    @Cron(CronExpression.EVERY_10_SECONDS) // A cada 10 segundos
    async sincronizarEquipamentosPorEmail(): Promise<void> {
        console.log('⏳ Buscando novos e-mails...');

        try {
            const connection = await Imap.connect({
                imap: {
                    user: 'snmp@pwmenergia.com.br',
                    password: 'pwm2010',
                    host: 'imap.kinghost.net',
                    port: 993,
                    tls: true,
                    tlsOptions: { rejectUnauthorized: false },
                    authTimeout: 5000,
                },
            });

            await connection.openBox('INBOX');

            const messages = await connection.search(['UNSEEN'], {
                bodies: [''],
                struct: true,
                markSeen: true,
            });

            for (const msg of messages) {
                const part = msg.parts.find(p => p.which === '');
                if (!part) continue;

                const raw = Buffer.isBuffer(part.body)
                    ? part.body
                    : Buffer.from(part.body as string, 'utf-8');

                const parsed = await simpleParser(raw);
                const fields: Record<string, string> = {};

                // Parse HTML
                if (parsed.html) {
                    const $ = cheerio.load(parsed.html);
                    $('table tr').each((_, row) => {
                        const cells = $(row).find('td');
                        if (cells.length >= 2) {
                            const key = cells.eq(0).text().trim();
                            const value = cells.eq(1).text().trim();
                            if (key) fields[key] = value;
                        }
                    });
                }

                // Fallback para texto puro
                if (Object.keys(fields).length === 0 && parsed.text) {
                    parsed.text
                        .split(/\r?\n/)
                        .map(l => l.trim())
                        .filter(Boolean)
                        .forEach(line => {
                            const [rawKey, ...rest] = line.split(':');
                            const val = rest.join(':').trim();
                            if (rawKey && val) fields[rawKey.trim()] = val;
                        });
                }

                const dataEmailTexto = fields['Date/Time'] || fields['Data/Hora'];
                const ultimaAtualizacao = msg.attributes.date
                    ? moment(msg.attributes.date).tz('America/Sao_Paulo').toDate()
                    : new Date();

                await this.registerOrUpdate({
                    nome: fields['Nome Sistema'] || fields['System Name'] || '(sem nome)',
                    localidade: fields['Localidade Sistema'] || fields['System Location'] || '(sem localidade)',
                    ip: fields['IP'] || '(sem IP)',
                    contato: fields['Contato Sistema'] || fields['System Contact'] || '(sem contato)',
                    ultimaAtualizacao,
                });
            }

            await connection.end();
            console.log('✅ Sincronização concluída!');
        } catch (err) {
            console.error('❌ Erro na sincronização de e-mails:', err.message);
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async verificarEquipamentosInativos(): Promise<void> {
        const equipamentos = await this.repo.find();
        const agora = Date.now();

        for (const eq of equipamentos) {
            const diff = agora - new Date(eq.ultimaAtualizacao).getTime();
            const offline = diff > 2 * 24 * 60 * 60 * 1000;

            if (offline && eq.status !== 'offline') {
                await this.repo.update(eq.id, { status: 'offline' });
                console.log(`❌ ${eq.nome} marcado como OFFLINE`);
            }

            if (!offline && eq.status !== 'online') {
                await this.repo.update(eq.id, { status: 'online' });
                console.log(`✅ ${eq.nome} voltou para ONLINE`);
            }

        }
    }

    async alterarEquipamento(id: number, dadosNovos: any): Promise<any> {
        const equipamento = await this.repo.findOne({ where: { id } });
        if (!equipamento) {
            throw new Error('Equipamento não encontrado');
        }

        if (!dadosNovos.endereco) {
            equipamento.endereco = ''
            equipamento.lat = 0
            equipamento.lon = 0
        }

        // Busca nova geolocalização
        const coordenadas = await this.geocodificacaoService.buscarCoordenadas(dadosNovos.endereco);

        // Atualiza campos
        equipamento.endereco = dadosNovos.endereco;
        if (typeof coordenadas?.lat === 'number') {
            equipamento.lat = coordenadas.lat;
        }
        if (typeof coordenadas?.lon === 'number') {
            equipamento.lon = coordenadas.lon;
        }

        equipamento.observacao = dadosNovos.observacao

        console.log(equipamento)

        return this.repo.save(equipamento);
    }

    async deleteEquipamento(id: number): Promise<{ message: string }> {
        const equipamento = await this.repo.findOne({ where: { id } });
        if (!equipamento) {
            throw new NotFoundException('Equipamento não encontrado');
        }

        equipamento.apagado = true;
        await this.repo.save(equipamento);

        return { message: 'Equipamento marcado como apagado' };
    }


    async deleteEquipamentoAll(ids: number[]): Promise<{ message: string }> {
        if (!ids || ids.length === 0) {
            throw new NotFoundException('Nenhum id passado.');
        }

        const equipamentos = await this.repo.findBy({ id: In(ids) });
        if (!equipamentos.length) {
            throw new NotFoundException('Equipamento(s) não encontrado(s)');
        }

        for (const equipamento of equipamentos) {
            equipamento.apagado = true;
        }

        await this.repo.save(equipamentos);

        return { message: 'Equipamento(s) marcado(s) como apagado(s)' };
    }

}