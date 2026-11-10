import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgendamentoService } from './agendamento.service';

describe('AgendamentoService', () => {
  const prisma = {
    laboratorio: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    agendamento: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new AgendamentoService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.laboratorio.findUnique = jest.fn().mockResolvedValue({
      id: 'lab-1',
      capacidade: 10,
    });
    prisma.user.findUnique = jest.fn().mockResolvedValue({ id: 'user-1' });
    prisma.agendamento.findMany = jest.fn().mockResolvedValue([]);
    prisma.agendamento.create = jest.fn();
  });

  const futureDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  };

  const reservation = {
    laboratorioId: 'lab-1',
    computadorId: 'PC-01',
    data: futureDate(),
    periodo: 'manha' as const,
    horaInicio: '09:00',
    horaFim: '11:00',
    finalidade: 'Aula prática de teste',
  };

  it('rejects an overlapping reservation for the same computer', async () => {
    prisma.agendamento.findMany = jest
      .fn()
      .mockResolvedValue([
        { computadorId: 'PC-01', horaInicio: '10:00', horaFim: '12:00' },
      ]);

    await expect(service.create('user-1', reservation)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('only allows monitors to decide after-hours requests', async () => {
    prisma.agendamento.findUnique = jest.fn().mockResolvedValue({
      id: 'booking-1',
      status: 'pendente',
      foraDoExpediente: false,
    });

    await expect(
      service.updateStatus(
        'booking-1',
        { status: 'aprovado' },
        'monitor-1',
        'monitor',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each(['aprovado', 'recusado'] as const)(
    'returns the decision time when a request is %s',
    async (status) => {
      const createdAt = new Date('2026-11-10T12:00:00.000Z');
      const updatedAt = new Date('2026-11-10T14:30:00.000Z');

      prisma.agendamento.findUnique = jest.fn().mockResolvedValue({
        id: 'booking-1',
        status: 'pendente',
        foraDoExpediente: false,
      });
      prisma.agendamento.update = jest.fn().mockResolvedValue({
        id: 'booking-1',
        usuarioId: 'user-1',
        laboratorioId: 'lab-1',
        computadorId: null,
        data: '2026-11-12',
        periodo: 'manha',
        horaInicio: '09:00',
        horaFim: '11:00',
        finalidade: 'Aula prática de teste',
        precisaMonitor: false,
        foraDoExpediente: false,
        ehEad: false,
        status,
        aprovadoPor: status === 'aprovado' ? 'admin-1' : null,
        createdAt,
        updatedAt,
        laboratorio: { id: 'lab-1', nome: 'Laboratório de Redes' },
        usuario: { id: 'user-1', name: 'Aluno de teste' },
      });

      const result = await service.updateStatus(
        'booking-1',
        { status },
        'admin-1',
        'admin',
      );

      expect(result.criadoEm).toBe(createdAt.toISOString());
      expect(result.respondidaEm).toBe(updatedAt.toISOString());
    },
  );
});
