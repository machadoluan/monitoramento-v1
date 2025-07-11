// src/alert/alerta-ativo.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsCriticos } from './alets-criticos.entity';

@Injectable()
export class AlertaAtivoService {
    constructor(
        @InjectRepository(AlertsCriticos)
        private repo: Repository<AlertsCriticos>
    ) { }

    async criarOuAtualizar(dto: Partial<AlertsCriticos>): Promise<AlertsCriticos> {
        const existente = await this.repo.findOne({
            where: {
                nomeSistema: dto.nomeSistema,
                ip: dto.ip,
                aviso: dto.aviso,
            },
        });

        console.log(existente)

        if (existente) {
            return existente; // já está ativo
        }

        return this.repo.save(dto);
    }

    async removerSeExistir(nomeSistema: string) {
        await this.repo.delete({ nomeSistema });
    }

    async listarAtivos() {
        return this.repo.find();
    }
}
