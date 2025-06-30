import { Controller, Get } from '@nestjs/common';
import { EquipamentosService } from './equipamentos.service';

@Controller('equipamentos')
export class EquipamentosController {

    constructor(private readonly equipamentoSerice: EquipamentosService) { }

    @Get()
    async list() {
        return this.equipamentoSerice.findAll()
    }
}
