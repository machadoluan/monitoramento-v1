// src/email/email.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { AlertEntity } from 'src/alert/alert.entity';

// importe os módulos que providenciam os serviços
import { KeywordModule } from 'src/keyword/keyword.module';
import { AlertModule }   from 'src/alert/alert.module';
import { EmailRegistryService } from './email-registry.service';
import { EmailEntity } from './email.entity';
import { EmailBlockEntity } from './emailsBlock.entity';
import { ContratosService } from 'src/contratos/contratos.service';
import { ContratosModule } from 'src/contratos/contratos.module';
import { EmailGroup } from '../email-group/email-group.entity';
import { EmailGroupService } from 'src/email-group/email-group.service';
import { AlertaAtivoService } from 'src/equipamentos/alerta-ativo.service';
import { AlertsCriticos } from 'src/equipamentos/alets-criticos.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity, EmailEntity, EmailBlockEntity, EmailGroup, AlertsCriticos]),  
    KeywordModule,                          
    AlertModule,   
    ContratosModule
  ],
  providers: [
    EmailService,
    EmailRegistryService,
    EmailGroupService,
    AlertaAtivoService
  ],
  controllers: [EmailController],
  exports: [EmailService, EmailRegistryService],
})
export class EmailModule {}
    