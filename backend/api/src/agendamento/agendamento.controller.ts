import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgendamentoService } from './agendamento.service';
import {
  CreateAgendamentoDto,
  UpdateAgendamentoStatusDto,
} from './dto/agendamento.dto';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'funcionario', 'monitor')
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.agendamentoService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findByUser(@CurrentUser('sub') userId: string) {
    return this.agendamentoService.findByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id') agendamentoId: string,
    @CurrentUser('sub') requesterId: string,
    @CurrentUser('role') requesterRole: string,
  ) {
    return this.agendamentoService.findById(
      agendamentoId,
      requesterId,
      requesterRole,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('sub') userId: string,
    @Body() createAgendamentoDto: CreateAgendamentoDto,
  ) {
    return this.agendamentoService.create(userId, createAgendamentoDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'funcionario', 'monitor')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') agendamentoId: string,
    @Body() updateAgendamentoStatusDto: UpdateAgendamentoStatusDto,
    @CurrentUser('sub') approverId: string,
    @CurrentUser('role') approverRole: string,
  ) {
    return this.agendamentoService.updateStatus(
      agendamentoId,
      updateAgendamentoStatusDto,
      approverId,
      approverRole,
    );
  }
}
