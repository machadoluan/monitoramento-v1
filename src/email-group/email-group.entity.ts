// src/email-group/email-group.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('EmailGroup')
export class EmailGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  keywords: string; // JSON array de palavras-chave

  @Column()
  chatId: string; // ID do chat do Telegram para notificações
}