// src/email-group/email-group.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailGroup } from './email-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEmailGroupDto, UpdateEmailGroupDto } from './email-group.dto';
import { error } from 'console';

@Injectable()
export class EmailGroupService {
    constructor(
        @InjectRepository(EmailGroup)
        private emailGroupRepository: Repository<EmailGroup>,
    ) { }

    async findAll(): Promise<EmailGroup[]> {
        const groups = await this.emailGroupRepository.find();
        return groups.map(g => ({
            ...g,
            keywords: g.keywords ? JSON.parse(g.keywords) : []
        }));
    }

    async create(dto: CreateEmailGroupDto): Promise<EmailGroup> {
        if (!dto.name || !dto.chatId) {
            throw new BadRequestException('Nome e chatId são obrigatórios');
        }

        const group = this.emailGroupRepository.create({
            ...dto,
            keywords: JSON.stringify(dto.keywords || [])
        });

        return await this.emailGroupRepository.save(group);
    }

    async update(id: number, dto: UpdateEmailGroupDto): Promise<EmailGroup> {
        const group = await this.emailGroupRepository.findOne({ where: { id } });
        if (!group) {
            throw new BadRequestException('Grupo não encontrado');
        }

        const updatedGroup = this.emailGroupRepository.merge(group, {
            ...dto,
            keywords: JSON.stringify(dto.keywords || [])
        });

        return await this.emailGroupRepository.save(updatedGroup);
    }

    async delete(id: number): Promise<{ success: boolean, message: string }> {
        const Email = await this.emailGroupRepository.findOne({ where: { id } })

        if (!Email) {
            throw new BadRequestException('Contrato não encontrado');
        }

        await this.emailGroupRepository.delete(id);

        return { success: true, message: 'Email deletado com sucesso' }
    }
}