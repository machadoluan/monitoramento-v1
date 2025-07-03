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

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly kw: KeywordService,
    private readonly alertService: AlertService,
    private readonly emailRegistryService: EmailRegistryService,
    private readonly contratosService: ContratosService,
    private readonly emailGroupService: EmailGroupService
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


  // Substitua sua função existente por esta
  private async enviarTelegramComOuSemCorpo(dto: AlertDto, id: string, chatId: string) {
    // Pega os detalhes dinâmicos do alerta
    const { emoji, title, summary } = this.getAlertDetails(dto);

    const msgText = [
      `${emoji} *${title}*`, // Título dinâmico e em negrito
      `_${summary}_`, // Resumo em itálico
      `---`,
      `🔖 *Status:* \`${dto.status}\``,
      `🖥️ *Sistema:* ${dto.nomeSistema}`,
      `📍 *Localidade:* ${dto.localidade}`,
      ``, // Linha em branco para espaçamento
      `📅 *Data:* ${dto.data}`,
      `⏰ *Hora:* ${dto.hora}`,
      ``,
      `📞 *Contato:* ${dto.contato}`,
    ].join('\n');

    // extrai só dígitos do contato
    const tel = dto.contato.replace(/\D/g, '');

    const keyboard: any[][] = [
      [{ text: '📨 Ver corpo do e-mail', callback_data: `ver_corpo::${id}` }]
    ];

    if (tel.length >= 8) {
      keyboard.push([
        { text: '💬 Avisar cliente no WhatsApp', callback_data: `avisar::${id}` }
      ]);
    }

    // IMPORTANTE: Adicione o 'parse_mode: Markdown' para que a formatação funcione
    const payload = {
      chat_id: chatId,
      text: msgText,
      parse_mode: 'Markdown', // Habilita negrito, itálico, etc.
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
      try {
        const host = reg.email.includes('@gmail.com')
          ? 'imap.gmail.com'
          : 'imap.kinghost.net';

        this.logger.log(`Conectando ao IMAP para ${reg.email}...`);
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

        if (messages.length > 0) {
          this.logger.log(`[${reg.email}] Encontrados ${messages.length} e-mails não lidos.`);
        }

        // PASSO 1: Fazer o parse de todas as mensagens para extrair os dados
        // Usamos Promise.all para fazer isso de forma mais rápida e paralela.
        const parsedEmails = await Promise.all(
          messages.map(async (msg) => {
            const part = msg.parts.find(p => p.which === '');
            if (!part) return null;

            const raw = Buffer.isBuffer(part.body)
              ? part.body
              : Buffer.from(part.body as string, 'utf-8');

            // Retorna o objeto completo do e-mail após o parse
            return await simpleParser(raw);
          })
        );

        // Filtramos e-mails que possam ter falhado no parse
        const validEmails = parsedEmails.filter(p => p !== null) as ParsedMail[];

        // PASSO 2: Ordenar os e-mails pela data (do mais antigo para o mais novo)
        // Esta é a etapa que resolve o problema da ordem de notificação.
        validEmails.sort((a, b) => {
          const dateA = a.date || new Date(0); // Garante que e-mails sem data não quebrem o sort
          const dateB = b.date || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });

        this.logger.log(`E-mails ordenados por data. Iniciando processamento...`);

        const grupos = await this.emailGroupService.findAll();

        // PASSO 3: Iterar sobre a lista JÁ ORDENADA e aplicar a lógica de negócio
        for (const parsed of validEmails) {
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
              const match = line.match(/^(.+?)\s*:\s*(.+)$/);
              if (match) {
                const [, rawKey, val] = match;
                currentKey = rawKey.trim();
                fields[currentKey] = val.trim();
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
          const relevante = palavrasChave.some(k => U.includes(k));
          const palavrasChaveBlock = await this.kw.getAllBlock();
          const relevanteBlock = palavrasChaveBlock.some(k => U.includes(k));
          const palavrasEncontradas = palavrasChave.filter(k => U.includes(k));
          const palavrasEncontradasBlock = palavrasChaveBlock.filter(k => U.includes(k));

          const rawDataHora = fields['Data/Hora'] || fields['Date/Time'] || '';
          const rawData = fields['Date'] || fields['Data'] || '';
          const rawHora = fields['Time'] || fields['Hora'] || '';

          const { data: data1, hora: hora1 } = this.extrairDataHora(rawDataHora);
          const { data: data2 } = this.extrairDataHora(rawData);
          const { hora: hora2 } = this.extrairDataHora(rawHora);

          const data = data1 || data2 || '(sem data)';
          const hora = hora1 || hora2 || '';

          const contatoRaw = fields['Contato Sistema'] || fields['System Contact'] || fields['Contact'] || fields['Contato'] || '';
          const localidadeRaw = fields['Localidade Sistema'] || fields['System Location'] || fields['Location'] || fields['Local'] || '';
          const [contato, localidadeExtra] = contatoRaw.split(/System Location:/i);
          const localidade = localidadeExtra?.trim() || localidadeRaw;

          const dto: AlertDto = {
            time: `${data} ${hora}`.trim(),
            aviso: assunto,
            data: this.formatarDataParaBR(data),
            hora: hora,
            ip: fields['IP'] || '(sem IP)',
            nomeSistema: fields['Nome Sistema'] || fields['System Name'] || fields['Name'] || fields['Nome'] || '(sem nome)',
            contato: contato?.trim() || '(sem contato)',
            localidade: localidade || '(sem localidade)',
            status: fields['Status'] || fields['Code'] || '(sem status)',
            mensagemOriginal: corpoTexto,
          };

          if (registrosBlock.some(r => r.email === remetente)) {
            this.logger.log(`🗑️ Ignorado (remetente bloqueado): ${assunto} de ${remetente}`);
            continue;
          }

          if (relevanteBlock) {
            this.logger.log(`🗑️ Ignorado (palavra bloqueada: ${palavrasEncontradasBlock}): ${assunto}`);
            continue;
          }

          const contatoNumerico = this.extrairTelefone(dto.contato);
          const cliente = contatoNumerico ? await this.contratosService.findForNumber(contatoNumerico) : null;

          if (cliente) {
            // ... sua lógica de cliente e envio de WhatsApp ...
          }

          if (relevante) {
            this.logger.log(`✅ Relevante: "${assunto}". Processando envio...`);
            const saved = await this.alertService.create(dto);
            let enviadoParaGrupo = false;

            for (const grupo of grupos) {
              const palavrasGrupo = Array.isArray(grupo.keywords)
                ? grupo.keywords.map(k => k.toUpperCase())
                : JSON.parse(grupo.keywords || '[]').map((k: string) => k.toUpperCase());

              const pertenceAoGrupo = palavrasGrupo.some(k => U.includes(k));

              if (pertenceAoGrupo) {
                await this.enviarTelegramComOuSemCorpo(dto, saved.id, grupo.chatId);
                this.logger.log(`📬 Alerta enviado para o grupo "${grupo.name}" (chatId: ${grupo.chatId})`);
                enviadoParaGrupo = true;
              }
            }

            if (!enviadoParaGrupo) {
              await this.enviarTelegramComOuSemCorpo(dto, saved.id, reg.chatId);
              this.logger.log(`📬 Alerta enviado para chatId padrão do remetente ${reg.chatId}`);
            }
            console.log(`Palavras-chave encontradas: ${palavrasEncontradas}`);
          } else {
            this.logger.log(`🗑️ Ignorado (não relevante): ${assunto}`);
          }
        } // Fim do loop for (const parsed of validEmails)

        await connection.end();
        this.logger.log(`Desconectado de ${reg.email}.`);

      } catch (error) {
        this.logger.error(`💥 Erro fatal no processamento de e-mails para ${reg.email}: ${error.message}`, error.stack);
      }
    } // Fim do loop for (const reg of registros)
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


  // Adicione esta função dentro da sua classe EmailService
  private getAlertDetails(dto: AlertDto): { emoji: string; title: string; summary: string } {
    const statusUpper = (dto.status || '').toUpperCase();
    const avisoUpper = (dto.aviso || '').toUpperCase();

    if (statusUpper.includes('NORMAL') || avisoUpper.includes('NORMAL')) {
      return {
        emoji: '✅',
        title: `NORMALIZADO: ${dto.aviso}`,
        summary: 'Um evento anterior foi resolvido.'
      };
    }
    if (statusUpper.includes('OVERRUN') || statusUpper.includes('FAIL') || avisoUpper.includes('CRITICAL')) {
      return {
        emoji: '🚨',
        title: `ALERTA CRÍTICO: ${dto.aviso}`,
        summary: 'Um evento crítico foi detectado e requer atenção.'
      };
    }

    // Padrão para outros tipos de alerta
    return {
      emoji: '⚠️',
      title: `ALERTA: ${dto.aviso}`,
      summary: 'Um novo evento foi registrado no sistema.'
    };
  }

}