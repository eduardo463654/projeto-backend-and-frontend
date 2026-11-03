import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAgendamentoDto,
  UpdateAgendamentoStatusDto,
} from './dto/agendamento.dto';

@Injectable()
export class AgendamentoService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const agendamentos = await this.prismaService.agendamento.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: true,
        laboratorio: true,
      },
    });

    return agendamentos.map((agendamento) => this.mapAgendamento(agendamento));
  }

  async findByUser(userId: string) {
    const agendamentos = await this.prismaService.agendamento.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' },
      include: { laboratorio: true },
    });

    return agendamentos.map((agendamento) => this.mapAgendamento(agendamento));
  }

  async findById(
    agendamentoId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    const agendamento = await this.prismaService.agendamento.findUnique({
      where: { id: agendamentoId },
      include: { usuario: true, laboratorio: true },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (
      requesterId !== agendamento.usuarioId &&
      !['admin', 'funcionario', 'monitor'].includes(requesterRole)
    ) {
      throw new ForbiddenException('Você não pode consultar este agendamento.');
    }

    return this.mapAgendamento(agendamento);
  }

  async create(userId: string, createAgendamentoDto: CreateAgendamentoDto) {
    const inicio = this.toMinutes(createAgendamentoDto.horaInicio);
    const fim = this.toMinutes(createAgendamentoDto.horaFim);

    if (fim <= inicio) {
      throw new BadRequestException(
        'O horário final deve ser posterior ao inicial.',
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    if (
      createAgendamentoDto.data < today ||
      (createAgendamentoDto.data === today &&
        inicio <= new Date().getHours() * 60 + new Date().getMinutes())
    ) {
      throw new BadRequestException(
        'O agendamento deve ocorrer em um horário futuro.',
      );
    }

    const laboratorio = await this.prismaService.laboratorio.findUnique({
      where: { id: createAgendamentoDto.laboratorioId },
    });

    if (!laboratorio) {
      throw new NotFoundException('Laboratório informado não existe.');
    }

    const usuario = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const existing = await this.prismaService.agendamento.findMany({
      where: {
        laboratorioId: createAgendamentoDto.laboratorioId,
        data: createAgendamentoDto.data,
        status: { in: ['pendente', 'aprovado'] },
      },
    });

    const overlapping = existing.filter(
      (item) =>
        inicio < this.toMinutes(item.horaFim) &&
        fim > this.toMinutes(item.horaInicio),
    );
    const hasResourceConflict = overlapping.some(
      (item) =>
        !createAgendamentoDto.computadorId ||
        !item.computadorId ||
        item.computadorId === createAgendamentoDto.computadorId,
    );

    if (hasResourceConflict || overlapping.length >= laboratorio.capacidade) {
      throw new ConflictException(
        'Este laboratório ou computador já está reservado nesse horário.',
      );
    }

    const agendamento = await this.prismaService.agendamento.create({
      data: {
        usuarioId: userId,
        laboratorioId: createAgendamentoDto.laboratorioId,
        computadorId: createAgendamentoDto.computadorId,
        data: createAgendamentoDto.data,
        periodo: createAgendamentoDto.periodo,
        horaInicio: createAgendamentoDto.horaInicio,
        horaFim: createAgendamentoDto.horaFim,
        finalidade: createAgendamentoDto.finalidade,
        precisaMonitor: createAgendamentoDto.precisaMonitor ?? false,
        foraDoExpediente: inicio < 8 * 60 || fim > 22 * 60,
        ehEad: createAgendamentoDto.ehEad ?? false,
        status: 'pendente',
      },
      include: { laboratorio: true },
    });

    return this.mapAgendamento(agendamento);
  }

  async updateStatus(
    agendamentoId: string,
    updateAgendamentoStatusDto: UpdateAgendamentoStatusDto,
    approverId: string,
    approverRole: string,
  ) {
    const agendamento = await this.prismaService.agendamento.findUnique({
      where: { id: agendamentoId },
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (agendamento.status !== 'pendente') {
      throw new ConflictException(
        'Somente agendamentos pendentes podem ser decididos.',
      );
    }

    if (
      approverRole === 'monitor' &&
      (!agendamento.foraDoExpediente ||
        !['aprovado', 'recusado'].includes(updateAgendamentoStatusDto.status))
    ) {
      throw new ForbiddenException(
        'Monitores só podem decidir solicitações fora do expediente.',
      );
    }

    const updated = await this.prismaService.agendamento.update({
      where: { id: agendamentoId },
      data: {
        status: updateAgendamentoStatusDto.status,
        aprovadoPor:
          updateAgendamentoStatusDto.status === 'aprovado'
            ? approverId
            : undefined,
      },
      include: { laboratorio: true, usuario: true },
    });

    return this.mapAgendamento(updated);
  }

  private mapAgendamento(agendamento: {
    id: string;
    usuarioId: string;
    laboratorioId: string;
    computadorId?: string | null;
    data: string;
    periodo: 'manha' | 'tarde' | 'noite';
    horaInicio: string;
    horaFim: string;
    finalidade: string;
    precisaMonitor: boolean;
    foraDoExpediente: boolean;
    ehEad: boolean;
    status:
      | 'pendente'
      | 'aprovado'
      | 'recusado'
      | 'cancelado'
      | 'aguardando_confirmacao_cancelamento';
    aprovadoPor?: string | null;
    createdAt: Date;
    laboratorio?: { id: string; nome?: string } | null;
    usuario?: { id: string; name: string } | null;
  }) {
    return {
      id: agendamento.id,
      usuarioId: agendamento.usuarioId,
      laboratorioId: agendamento.laboratorioId,
      computadorId: agendamento.computadorId ?? undefined,
      data: agendamento.data,
      periodo: agendamento.periodo,
      horaInicio: agendamento.horaInicio,
      horaFim: agendamento.horaFim,
      finalidade: agendamento.finalidade,
      precisaMonitor: agendamento.precisaMonitor,
      foraDoExpediente: agendamento.foraDoExpediente,
      ehEad: agendamento.ehEad,
      status: agendamento.status,
      aprovadoPor: agendamento.aprovadoPor ?? undefined,
      criadoEm: agendamento.createdAt.toISOString(),
      laboratorio: agendamento.laboratorio
        ? { id: agendamento.laboratorio.id, nome: agendamento.laboratorio.nome }
        : undefined,
      usuario: agendamento.usuario
        ? { id: agendamento.usuario.id, nome: agendamento.usuario.name }
        : undefined,
    };
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
