import { Module } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';
import { EquipamentosController } from './equipamentos.controller';
import { EmailRegistryService } from 'src/email/email-registry.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipamento } from './equipamentos.entity';
import { EmailModule } from 'src/email/email.module';
import { GeocodificacaoService } from './geocodificacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Equipamento]), EmailModule],
  providers: [EquipamentosService, GeocodificacaoService],
  controllers: [EquipamentosController]
})
export class EquipamentosModule {}
