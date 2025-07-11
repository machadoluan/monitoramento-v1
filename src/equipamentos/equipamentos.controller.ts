import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';
import { AlertaAtivoService } from './alerta-ativo.service';

@Controller('equipamentos')
export class EquipamentosController {

    constructor(private readonly equipamentoSerice: EquipamentosService, private readonly alertaAtivoService: AlertaAtivoService) { }

    @Get()
    async list() {
        return this.equipamentoSerice.findAll()
    }

    @Put(':id/endereco')
    async atualizarEndereco(
        @Param('id') id: string,
        @Body('dadosNovos') dadosNovos: any
    ) {
        console.log(`Atualizando endereço do equipamento com ID: ${id} para: ${dadosNovos}`);
        const equipamentoId = parseInt(id);
        if (isNaN(equipamentoId)) {
            throw new Error('ID inválido');
        }

        return this.equipamentoSerice.alterarEquipamento(equipamentoId, dadosNovos);
    }

    @Delete(':id')
    async deleteEquipamento(
        @Param('id') id: number
    ) {
        return this.equipamentoSerice.deleteEquipamento(id)
    }

    @Post('deleteAll')
    async deleteVariosEquipamentos(@Body('ids') ids: number[]) {
        return this.equipamentoSerice.deleteEquipamentoAll(ids);
    }

    @Get('criticos-ativos')
    async listAtivos() {
        return this.alertaAtivoService.listarAtivos()
    }
}
