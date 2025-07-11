// src/alert/alert.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AlertEntity } from './alert.entity';
import { AlertDto } from './dto/alert.dto';
import { Alert } from '@microsoft/microsoft-graph-types';
import { Keyword } from 'src/keyword/keyword.entity';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly repo: Repository<AlertEntity>,
    @InjectRepository(Keyword)
    private readonly repoKeyword: Repository<Keyword>,
  ) { }

  async create(dto: AlertDto): Promise<AlertEntity> {
    const alert = this.repo.create(dto);
    return this.repo.save(alert);
  }

  async findAll(): Promise<AlertEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async getDailyReport(): Promise<any> {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const alerts = await this.repo.find({
      where: {
        createdAt: Between(start, end),
      },
    });

    // Buscar alertas críticos do banco (KeywordEntity)
    const criticalKeywords = await this.repoKeyword.find(); // supondo que esse repo está injetado
    const criticalWords = criticalKeywords.map(k => k.word.toUpperCase());

    const report = {};

    for (const alert of alerts) {
      const nome = alert.nomeSistema;
      const status = alert.status?.toUpperCase() || '';

      if (!report[nome]) {
        report[nome] = {
          total: 0,
          criticos: 0,
          normais: 0,
          detalhado: {}, // contar por status
        };
      }

      const isCritico = criticalWords.some(padrao => status.includes(padrao));

      report[nome].total += 1;
      if (isCritico) {
        report[nome].criticos += 1;
      } else {
        report[nome].normais += 1;
      }

      if (!report[nome].detalhado[status]) {
        report[nome].detalhado[status] = 1;
      } else {
        report[nome].detalhado[status] += 1;
      }
    }

    return report;
  }


}
