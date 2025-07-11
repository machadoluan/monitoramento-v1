import { Module } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';
import { EquipamentosController } from './equipamentos.controller';
import { EmailRegistryService } from 'src/email/email-registry.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipamento } from './equipamentos.entity';
import { EmailModule } from 'src/email/email.module';
import { GeocodificacaoService } from './geocodificacao.service';
import { AlertaAtivoService } from './alerta-ativo.service';
import { AlertsCriticos } from './alets-criticos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipamento, AlertsCriticos]), EmailModule],
  providers: [EquipamentosService, GeocodificacaoService, AlertaAtivoService],
  controllers: [EquipamentosController],
  exports: [AlertaAtivoService]
})
export class EquipamentosModule {}
