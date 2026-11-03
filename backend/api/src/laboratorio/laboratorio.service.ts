import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLaboratorioDto,
  UpdateLaboratorioDto,
} from './dto/laboratorio.dto';

@Injectable()
export class LaboratorioService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const laboratorios = await this.prismaService.laboratorio.findMany({
      orderBy: { nome: 'asc' },
    });

    return laboratorios.map((laboratorio) => this.mapLaboratorio(laboratorio));
  }

  async findById(laboratorioId: string) {
    const laboratorio = await this.prismaService.laboratorio.findUnique({
      where: { id: laboratorioId },
    });

    if (!laboratorio) {
      throw new NotFoundException('Laboratório não encontrado.');
    }

    return this.mapLaboratorio(laboratorio);
  }

  async create(createLaboratorioDto: CreateLaboratorioDto) {
    const nome = createLaboratorioDto.nome.trim();
    const existing = await this.prismaService.laboratorio.findFirst({
      where: { nome },
    });

    if (existing) {
      throw new ConflictException('Laboratório com este nome já existe.');
    }

    const laboratorio = await this.prismaService.laboratorio.create({
      data: {
        nome,
        tipo: createLaboratorioDto.tipo,
        capacidade: createLaboratorioDto.capacidade,
        horariosFixos: (createLaboratorioDto.horariosFixos ?? []) as any,
      },
    });

    return this.mapLaboratorio(laboratorio);
  }

  async updateById(
    laboratorioId: string,
    updateLaboratorioDto: UpdateLaboratorioDto,
  ) {
    await this.findById(laboratorioId);

    if (updateLaboratorioDto.nome) {
      const duplicate = await this.prismaService.laboratorio.findFirst({
        where: {
          nome: updateLaboratorioDto.nome.trim(),
          id: { not: laboratorioId },
        },
      });

      if (duplicate) {
        throw new ConflictException('Laboratório com este nome já existe.');
      }
    }

    const laboratorio = await this.prismaService.laboratorio.update({
      where: { id: laboratorioId },
      data: {
        nome: updateLaboratorioDto.nome?.trim() ?? undefined,
        tipo: updateLaboratorioDto.tipo,
        capacidade: updateLaboratorioDto.capacidade,
        horariosFixos: (updateLaboratorioDto.horariosFixos ?? undefined) as any,
      },
    });

    return this.mapLaboratorio(laboratorio);
  }

  async deleteById(laboratorioId: string) {
    await this.findById(laboratorioId);

    const bookings = await this.prismaService.agendamento.count({
      where: { laboratorioId },
    });

    if (bookings > 0) {
      throw new ConflictException(
        'Não é possível remover um laboratório que possui agendamentos.',
      );
    }

    await this.prismaService.laboratorio.delete({
      where: { id: laboratorioId },
    });
  }

  private mapLaboratorio(laboratorio: {
    id: string;
    nome: string;
    tipo: 'redes' | 'informatica';
    capacidade: number;
    horariosFixos: unknown;
  }) {
    return {
      id: laboratorio.id,
      nome: laboratorio.nome,
      tipo: laboratorio.tipo,
      capacidade: laboratorio.capacidade,
      horariosFixos: Array.isArray(laboratorio.horariosFixos)
        ? laboratorio.horariosFixos
        : [],
    };
  }
}
