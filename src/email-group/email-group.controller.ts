// src/email-group/email-group.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { EmailGroupService } from './email-group.service';
import { CreateEmailGroupDto, UpdateEmailGroupDto } from './email-group.dto';
import { EmailGroup } from './email-group.entity';

@Controller('email-groups')
export class EmailGroupController {
    constructor(private readonly service: EmailGroupService) { }

    @Get()
    findAll(): Promise<EmailGroup[]> {
        return this.service.findAll();
    }

    @Post()
    create(@Body() dto: CreateEmailGroupDto): Promise<EmailGroup> {
        return this.service.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateEmailGroupDto): Promise<EmailGroup> {
        return this.service.update(+id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<{ success: boolean, message: string }> {
        return this.service.delete(+id);
    }
}