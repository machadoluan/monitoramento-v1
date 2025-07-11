// data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { AlertEntity } from './src/alert/alert.entity';
import { Keyword } from './src/keyword/keyword.entity';
import { EmailEntity } from './src/email/email.entity';
import { BlockWord } from './src/keyword/blockword.entity';
import { EmailBlockEntity } from './src/email/emailsBlock.entity';
import { Contratos } from './src/contratos/contratos.entity';
import { EmailGroup } from './src/email-group/email-group.entity';
import { Equipamento } from './src/equipamentos/equipamentos.entity';
import * as dotenv from 'dotenv';
import { AlertsCriticos } from './src/equipamentos/alets-criticos.entity';


dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    AlertEntity,
    Keyword,
    EmailEntity,
    BlockWord,
    EmailBlockEntity,
    Contratos,
    EmailGroup,
    Equipamento,
    AlertsCriticos
  ],
  migrations: [process.env.NODE_ENV === 'production' ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],

  synchronize: false,
});
