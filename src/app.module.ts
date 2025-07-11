

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { TelegramModule } from './telegram/telegram.module';
import { AlertModule } from './alert/alert.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DebugModule } from './debug/debug.module';
import { AuthController } from './auth/auth.controller';
import { KeywordModule } from './keyword/keyword.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from './alert/alert.entity';
import { Keyword } from './keyword/keyword.entity';
import { EmailEntity } from './email/email.entity';
import { BlockWord } from './keyword/blockword.entity';
import { EmailBlockEntity } from './email/emailsBlock.entity';
import { ContratosModule } from './contratos/contratos.module';
import { Contratos } from './contratos/contratos.entity';
import { EmailGroupModule } from './email-group/email-group.module';
import { EmailGroup } from './email-group/email-group.entity';
import { EquipamentosModule } from './equipamentos/equipamentos.module';
import { Equipamento } from './equipamentos/equipamentos.entity';
import { AlertsCriticos } from './equipamentos/alets-criticos.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [AlertEntity, Keyword, EmailEntity, BlockWord, EmailBlockEntity, Contratos, EmailGroup, Equipamento, AlertsCriticos],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EmailModule,
    TelegramModule,
    KeywordModule,
    DebugModule,
    AlertModule,
    ContratosModule,
    EmailGroupModule,
    EquipamentosModule

  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule { }
