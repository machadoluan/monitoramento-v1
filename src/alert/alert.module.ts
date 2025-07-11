// src/alert/alert.module.ts
import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertsController } from './alert.controller';
import { AlertEntity } from './alert.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from 'src/keyword/keyword.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity, Keyword]),
  ],
  providers: [AlertService],
  controllers: [AlertsController],
  exports: [AlertService],
})
export class AlertModule {}
