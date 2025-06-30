import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique(['nome', 'localidade', 'ip'])
@Entity('equipamentos')
export class Equipamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  localidade: string;

  @Column()
  ip: string;

  @Column()
  contato: string;

  @Column({ type: 'timestamp' })
  ultimaAtualizacao: Date;

  @Column({ default: 'online' })
  status: 'online' | 'offline';
}
