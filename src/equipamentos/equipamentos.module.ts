import { Module } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';
import { EquipamentosController } from './equipamentos.controller';
import { EmailRegistryService } from 'src/email/email-registry.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipamento } from './equipamentos.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Equipamento]), EmailModule],
  providers: [EquipamentosService],
  controllers: [EquipamentosController]
})
export class EquipamentosModule {}
