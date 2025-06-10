import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AethosService {
  private readonly logger = new Logger(AethosService.name);
  private readonly API_URL = 'https://apizap.aethos.cloud/api/messages/send';
  private readonly token = 'SEU_TOKEN_AQUI'; // Substitua pelo token real

  async sendMessage(number: string, message: string): Promise<void> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          number: number, // Ex: 5598999999999
          body: message,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 200) {
        this.logger.log(`✅ Mensagem enviada para ${number}`);
      } else {
        this.logger.warn(`⚠️ Envio com status ${response.status}: ${response.data}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }
}
