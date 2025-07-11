// src/email/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeywordService } from '../keyword/keyword.service';
import { AlertService } from 'src/alert/alert.service';
import { AlertDto } from 'src/alert/dto/alert.dto';
import { EmailRegistryService } from './email-registry.service';
import * as cheerio from 'cheerio';
import { ContratosService } from 'src/contratos/contratos.service';
import { EmailGroupService } from 'src/email-group/email-group.service';
import { AlertaAtivoService } from 'src/equipamentos/alerta-ativo.service';

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly kw: KeywordService,
    private readonly alertService: AlertService,
    private readonly emailRegistryService: EmailRegistryService,
    private readonly contratosService: ContratosService,
    private readonly emailGroupService: EmailGroupService,
    private readonly alertaAtivoService: AlertaAtivoService,
  ) { }

  private processing = false;

  // private readonly imapConfig = {
  //   imap: {
  //     user: process.env.IMAP_EMAIL,
  //     password: process.env.IMAP_PASSWORD,
  //     host: process.env.IMAP_HOST,       // imap.kinghost.net
  //     port: Number(process.env.IMAP_PORT), // 993
  //     tls: process.env.IMAP_TLS === 'true',
  //     tlsOptions: { rejectUnauthorized: false },
  //     authTimeout: 5000,
  //   },
  // };


  private async enviarWhatsapp(telefone: string, dto: AlertDto) {
    const msgText = [
      '⚠️ *Alerta de No-break* ⚠️',
      `🖥️ *Aviso*: ${dto.aviso}`,
      `📅 *Data*: ${dto.data}`,
      `⏰ *Hora*: ${dto.hora}`,
      `🔖 *Status*: ${dto.status}`,
      ``,
      `Digite apenas o número:`,
      ``,
      `[1] Entrar em contato com um técnico`,
      `[2] Estou ciente do alerta`,
    ].join('\n');

    const payload = {
      number: telefone,
      message: msgText,
    };


    try {
      const res = await fetch(
        `${process.env.WHATSAPPAPI}/whatsapp/send-message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`📨 Resposta do whatasapp: ${JSON.stringify(data, null, 2)}`);
      } else {
        this.logger.log(`✅ Mensagem enviada ao Whatsapp com sucesso (numero: ${telefone})`);
      }
    } catch (err) {
      this.logger.error(`💥 Exceção ao enviar mensagem para Telegram: ${err.message}`);
    }
  }


  private async enviarTelegramComOuSemCorpo(dto: AlertDto, id: string, chatId: string) {
    const statusCritico = ['overrun', 'acima dos limites', 'entering bypass mode', 'entrando em modo bypass'];
    const isCritico = statusCritico.some(p => dto.status.toLowerCase().includes(p));
    const statusEmoji = isCritico ? '🔴' : '🟢'; // verde para normal, vermelho para crítico
    const msgText = [
      ' *PWM BOT - Alerta de No-break* ',
      '',
      `⚠️ *Aviso:* ${this.formatarAviso(dto.aviso)}`,
      '',
      `🖥️ *Sistema:* ${dto.nomeSistema}`,
      `🌍 *Localidade:* ${dto.localidade}`,
      `💻 *IP:* ${dto.ip}`,
      '',
      `📅 *Data:* ${dto.data}`,
      `⏰ *Hora:* ${dto.hora}`,
      '',
      `📊 *Status:* ${statusEmoji} *${dto.status}*`,
      '',
      `📞 *Contato:* ${dto.contato}`,
    ].join('\n');


    // extrai só dígitos do contato
    const tel = dto.contato.replace(/\D/g, '');

    const keyboard: any[][] = [
      [{ text: '📨 Ver corpo do e-mail', callback_data: `ver_corpo::${id}` }]
    ];

    if (tel.length >= 8) {
      const waText = encodeURIComponent(
        `Recebemos um alerta de ${dto.aviso}, está tudo bem?`
      );
      keyboard.push([
        { text: '💬 Avisar no whatsapp', callback_data: `avisar::${id}` }
      ]);
    }

    const payload = {
      chat_id: chatId,
      text: msgText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      },
    };

    this.logger.debug(`📤 Enviando mensagem para Telegram (chatId: ${chatId})`);
    this.logger.debug(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`❌ Erro ao enviar para Telegram: ${res.status} - ${res.statusText}`);
        this.logger.error(`📨 Resposta do Telegram: ${JSON.stringify(data, null, 2)}`);
      } else {
        this.logger.log(`✅ Mensagem enviada ao Telegram com sucesso (chatId: ${chatId})`);
      }
    } catch (err) {
      this.logger.error(`💥 Exceção ao enviar mensagem para Telegram: ${err.message}`);
    }
  }



  private extrairDataHora(valor: string): { data: string, hora: string } {
    let data = '';
    let hora = '';

    if (valor.includes(' ')) {
      const partes = valor.trim().split(' ');
      if (partes.length >= 2) {
        // Checa se a primeira parte é data
        if (/\d{2}\/\d{2}\/\d{4}/.test(partes[0]) || /\d{4}\/\d{2}\/\d{2}/.test(partes[0])) {
          data = partes[0];
          hora = partes[1];
        }
      }
    } else {
      if (/\d{2}\/\d{2}\/\d{4}/.test(valor) || /\d{4}\/\d{2}\/\d{2}/.test(valor)) {
        data = valor;
      } else if (/\d{2}:\d{2}:\d{2}/.test(valor)) {
        hora = valor;
      }
    }

    return { data, hora };
  }




  private async fetchAndProcess() {
    const registros = await this.emailRegistryService.list();
    const registrosBlock = await this.emailRegistryService.listBlock();

    for (const reg of registros) {
      const host = reg.email.includes('@gmail.com')
        ? 'imap.gmail.com'
        : 'imap.kinghost.net';

      const connection = await Imap.connect({
        imap: {
          user: reg.email,
          password: reg.senha,
          host,
          port: 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        },
      });

      await connection.openBox('INBOX');
      const messages = await connection.search(
        [['UNSEEN']],
        { bodies: [''], struct: true, markSeen: true },
      );

      const grupos = await this.emailGroupService.findAll();
      const parsedEmails: {
        dto: AlertDto,
        parsed: ParsedMail,
        reg: any,
        remetente: string,
        U: string,
        palavrasEncontradas: string[],
      }[] = [];

      for (const msg of messages) {
        const part = msg.parts.find(p => p.which === '');
        if (!part) continue;

        const raw = Buffer.isBuffer(part.body)
          ? part.body
          : Buffer.from(part.body as string, 'utf-8');

        const parsed: ParsedMail = await simpleParser(raw);

        const assunto = parsed.subject?.trim() || '(sem assunto)';
        const remetente = parsed.from?.value?.[0]?.address || '(sem remetente)';

        const fields: Record<string, string> = {};

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

        if (Object.keys(fields).length === 0 && parsed.text) {
          const lines = parsed.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          let currentKey = '';
          for (const line of lines) {
            if (line.includes(':')) {
              const [rawKey, ...rest] = line.split(':');
              const val = rest.join(':').trim();
              if (rawKey) {
                currentKey = rawKey.trim();
                fields[currentKey] = val;
              }
            } else if (currentKey) {
              fields[currentKey] = (fields[currentKey] + ' ' + line).trim();
            }
          }
        }

        const corpoTexto = (parsed.text || parsed.html || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const U = (assunto + ' ' + corpoTexto).toUpperCase();
        const palavrasChave = await this.kw.getAll();
        const palavrasChaveBlock = await this.kw.getAllBlock();
        const relevante = palavrasChave.some(k => U.includes(k));
        const relevanteBlock = palavrasChaveBlock.some(k => U.includes(k));

        const palavrasEncontradas = palavrasChave.filter(k => U.includes(k));
        const palavrasEncontradasBlock = palavrasChaveBlock.filter(k => U.includes(k));

        const rawDataHora = fields['Data/Hora'] || fields['Date/Time'] || '';
        const rawData = fields['Date'] || '';
        const rawHora = fields['Time'] || fields['hora'] || '';
        const { data: data1, hora: hora1 } = this.extrairDataHora(rawDataHora);
        const { data: data2 } = this.extrairDataHora(rawData);
        const { hora: hora2 } = this.extrairDataHora(rawHora);
        const data = data1 || data2 || '(sem data)';
        const hora = hora1 || hora2 || '';

        const contatoRaw = fields['Contato Sistema'] || fields['System Contact'] || fields['Contact'] || '';
        const localidadeRaw = fields['Localidade Sistema'] || fields['System Location'] || fields['Location'] || '';
        const [contato, localidadeExtra] = contatoRaw.split(/System Location:/i);
        const localidade = localidadeExtra?.trim() || localidadeRaw;

        const dto: AlertDto = {
          time: `${data} ${hora}`.trim(),
          aviso: assunto,
          data: this.formatarDataParaBR(data),
          hora: hora,
          ip: fields['IP'] || '(sem IP)',
          nomeSistema: fields['Nome Sistema'] || fields['System Name'] || fields['Name'] || '(sem nome)',
          contato: contato?.trim() || '(sem contato)',
          localidade: localidade || '(sem localidade)',
          status: fields['Status'] || fields['Code'] || '(sem status)',
          mensagemOriginal: corpoTexto,
        };

        const statusLower = dto.status.toLowerCase();

        const entrouBypass = statusLower.includes('entrando em modo bypass') ||
          statusLower.includes('entering bypass mode');

        const saiuBypass = statusLower.includes('retornando do modo bypass') ||
          statusLower.includes('return from bypass mode');


        console.log(entrouBypass)
        console.log(saiuBypass)

        if (entrouBypass) {
          this.alertaAtivoService.criarOuAtualizar(dto)
          this.logger.log(`🚨 Alerta crítico salvo: ${dto.nomeSistema} - ${dto.status}`);
        }

        if (saiuBypass) {
          this.alertaAtivoService.removerSeExistir(dto.nomeSistema)
          this.logger.log(`✅ Alerta resolvido removido: ${dto.nomeSistema}`);
        }

        if (
          registrosBlock.some(r => r.email === remetente) ||
          relevanteBlock ||
          /mailer-daemon|postmaster/i.test(remetente) ||
          /delivery status|undelivered|falha/i.test(assunto)
        ) {
          continue;
        }

        if (relevante) {
          parsedEmails.push({ dto, parsed, reg, remetente, U, palavrasEncontradas });
        }
      }

      // Ordena pela data/hora do evento
      parsedEmails.sort((a, b) => {
        const aTime = new Date(a.dto.time).getTime();
        const bTime = new Date(b.dto.time).getTime();
        return aTime - bTime;
      });

      for (const item of parsedEmails) {
        const { dto, parsed, reg, U, palavrasEncontradas } = item;

        const contatoNumerico = this.extrairTelefone(dto.contato);
        const cliente = contatoNumerico ? await this.contratosService.findForNumber(contatoNumerico) : null;

        if (cliente) {
          let tagsParaChecar: string[] = [];

          try {
            const tagsCliente: string[] = JSON.parse(cliente.tags || '[]');
            tagsParaChecar = tagsCliente.length
              ? tagsCliente.map(t => t.toUpperCase())
              : (await this.kw.getAll()).map(t => t.toUpperCase());

            const tagsEncontradas = tagsParaChecar.filter(tag => U.includes(tag));

            if (tagsEncontradas.length > 0 && contatoNumerico) {
              await this.enviarWhatsapp(`55${contatoNumerico}`, dto);
              this.logger.log(`✅ Alerta enviado para ${cliente.nome} (tags: ${tagsEncontradas.join(', ')})`);
            }
          } catch (error) {
            this.logger.error(`Erro nas tags do cliente ${cliente.nome}: ${error.message}`);
          }
        }

        const saved = await this.alertService.create(dto);
        const grupos = await this.emailGroupService.findAll();
        let enviadoParaGrupo = false;

        for (const grupo of grupos) {
          const palavrasGrupo = Array.isArray(grupo.keywords)
            ? grupo.keywords.map(k => k.toUpperCase())
            : JSON.parse(grupo.keywords || '[]').map((k: string) => k.toUpperCase());

          const pertenceAoGrupo = palavrasGrupo.some(k => U.includes(k));
          if (pertenceAoGrupo) {
            await this.enviarTelegramComOuSemCorpo(dto, saved.id, grupo.chatId);
            enviadoParaGrupo = true;
          }
        }

        if (!enviadoParaGrupo) {
          await this.enviarTelegramComOuSemCorpo(dto, saved.id, reg.chatId);
        }
      }

      await connection.end();
    }
  }



  @Cron(CronExpression.EVERY_5_SECONDS)
  async verificarPeriodicamente() {
    if (this.processing) return;
    this.processing = true;
    try {
      this.logger.log('⏱️ Iniciando verificação automática de e-mails');
      await this.fetchAndProcess();
    } finally {
      this.processing = false;
    }
  }

  private formatarDataParaBR(dataInput: string | Date): string {
    const data = new Date(dataInput);

    // Verifica se a data é válida
    if (isNaN(data.getTime())) return '(data inválida)';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // mês é 0-indexado
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }

  private extrairTelefone(texto: string): string | null {
    const somenteNumeros = texto.replace(/\D/g, '');

    // Exemplo: 048991481613 -> verifica se começa com 0 e tem ao menos 11 dígitos (caso BR)
    if (somenteNumeros.length >= 11 && somenteNumeros.startsWith('0')) {
      return somenteNumeros.substring(1);
    }

    return somenteNumeros;
  }


  private formatarAviso(aviso: string): string {
    // Ex: "Koch São F. do Sul - NBK01(172.20.76.81):UPS Load Normal (34%)"

    const match = aviso.match(/^(.+?)\s*-\s*.+?\(.*?\):\s*(.+)$/);
    if (match) {
      const nomeLoja = match[1].trim();       // "Koch São F. do Sul"
      const status = match[2].trim();         // "UPS Load Normal (34%)"
      return `${nomeLoja} | ${status}`;         // "Koch São F. do Sul UPS Load Normal (34%)"
    }

    // fallback
    return aviso;
  }
}