import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipamento } from './equipamentos.entity';
import { Repository } from 'typeorm';
import * as Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as cheerio from 'cheerio';
import { EmailRegistryService } from 'src/email/email-registry.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';

@Injectable()
export class EquipamentosService {
    constructor(
        @InjectRepository(Equipamento)
        private readonly repo: Repository<Equipamento>,
        private readonly emailRegistryService: EmailRegistryService,

    ) { }

    async registerOrUpdate(data: Partial<Equipamento>): Promise<Equipamento> {
        const existente = await this.repo.findOne({
            where: {
                nome: data.nome,
                localidade: data.localidade,
                ip: data.ip,
            },
        });

        if (existente) {
            existente.ultimaAtualizacao = data.ultimaAtualizacao || new Date();
            existente.contato = data.contato || existente.contato;
            existente.status = 'online';
            return this.repo.save(existente);
        } else {
            return this.repo.save({
                ...data,
                status: 'online',
                ultimaAtualizacao: data.ultimaAtualizacao || new Date(),
            });
        }
    }

    async marcarOffline(id: number) {
        await this.repo.update(id, { status: 'offline' });
    }

    async marcarOnline(id: number) {
        await this.repo.update(id, { status: 'online' });
    }

    async findAll(): Promise<Equipamento[]> {
        return this.repo.find({ order: { nome: 'ASC' } });
    }

    @Cron(CronExpression.EVERY_MINUTE
    )
    async sincronizarEquipamentosPorEmail(): Promise<void> {
        console.log('⏳ Iniciando sincronização de equipamentos por e-mail...');

        const doisDiasAtras = new Date();
        doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);

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

            const messages = await connection.search(
                ['UNSEEN'],
                { bodies: [''], struct: true, markSeen: true }, // marcar como lido após processar
            );


            for (const msg of messages) {
                const part = msg.parts.find(p => p.which === '');
                if (!part) continue;

                const raw = Buffer.isBuffer(part.body)
                    ? part.body
                    : Buffer.from(part.body as string, 'utf-8');

                const parsed = await simpleParser(raw);

                const fields: Record<string, string> = {};

                // HTML table parser
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

                // Fallback: plain text
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

                const ultimaAtualizacao = dataEmailTexto
                    ? moment.tz(dataEmailTexto, 'YYYY/MM/DD HH:mm:ss', 'America/Sao_Paulo').toDate()
                    : new Date();

                // Registra ou atualiza no-break
                await this.registerOrUpdate({
                    nome: fields['Nome Sistema'] || fields['System Name'] || '(sem nome)',
                    localidade: fields['Localidade Sistema'] || fields['System Location'] || '(sem localidade)',
                    ip: fields['IP'] || '(sem IP)',
                    contato: fields['Contato Sistema'] || fields['System Contact'] || '(sem contato)',
                    ultimaAtualizacao,
                });
            }

            await connection.end();
            console.log('✅ Sincronização finalizada com sucesso!');
        } catch (err) {
            console.error('❌ Erro ao conectar ou processar e-mail:', err.message);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async verificarEquipamentosInativos() {
        const equipamentos = await this.repo.find();
        const agora = new Date();

        for (const eq of equipamentos) {
            const diff = agora.getTime() - new Date(eq.ultimaAtualizacao).getTime();

            const offline = diff > 2 * 24 * 60 * 60 * 1000; // 2 dias

            if (offline && eq.status !== 'offline') {
                eq.status = 'offline';
                await this.repo.save(eq);
                console.log(`❌ ${eq.nome} marcado como OFFLINE`);
            }

            if (!offline && eq.status !== 'online') {
                eq.status = 'online';
                await this.repo.save(eq);
                console.log(`✅ ${eq.nome} voltou para ONLINE`);
            }
        }
    }

}
