import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLaboratorioDto, UpdateLaboratorioDto } from './dto/laboratorio.dto';
import { LaboratorioService } from './laboratorio.service';

@Controller('laboratorios')
export class LaboratorioController {
  constructor(private readonly laboratorioService: LaboratorioService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.laboratorioService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findById(@Param('id') laboratorioId: string) {
    return this.laboratorioService.findById(laboratorioId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'funcionario')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLaboratorioDto: CreateLaboratorioDto) {
    return this.laboratorioService.create(createLaboratorioDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'funcionario')
  @HttpCode(HttpStatus.OK)
  updateById(
    @Param('id') laboratorioId: string,
    @Body() updateLaboratorioDto: UpdateLaboratorioDto,
  ) {
    return this.laboratorioService.updateById(laboratorioId, updateLaboratorioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteById(@Param('id') laboratorioId: string) {
    this.laboratorioService.deleteById(laboratorioId);
  }
}
