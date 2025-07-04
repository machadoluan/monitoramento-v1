import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';

@Controller('equipamentos')
export class EquipamentosController {

    constructor(private readonly equipamentoSerice: EquipamentosService) { }

    @Get()
    async list() {
        return this.equipamentoSerice.findAll()
    }

    @Put(':id/endereco')
    async atualizarEndereco(
        @Param('id') id: string,
        @Body('endereco') endereco: string
    ) {
        console.log(`Atualizando endereço do equipamento com ID: ${id} para: ${endereco}`);
        const equipamentoId = parseInt(id);
        if (isNaN(equipamentoId)) {
            throw new Error('ID inválido');
        }

        return this.equipamentoSerice.alterarEquipamento(equipamentoId, endereco);
    }
}
