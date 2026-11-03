import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserData: CreateUserDto) {
    const normalizedEmail = createUserData.email.trim().toLowerCase();
    const existingUser = await this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado!');
    }

    if (createUserData.ra && createUserData.ra.trim()) {
      const userByRa = await this.prismaService.user.findUnique({
        where: { ra: createUserData.ra.trim() },
      });

      if (userByRa) {
        throw new ConflictException('RA já cadastrado!');
      }
    }

    const hashedPassword = bcrypt.hashSync(createUserData.password, 10);

    try {
      const user = await this.prismaService.user.create({
        data: {
          name: createUserData.name,
          phone: createUserData.phone,
          email: normalizedEmail,
          password: hashedPassword,
          ra: createUserData.ra?.trim() || undefined,
          role: createUserData.role,
        },
      });

      return this.mapUser(user);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('E-mail ou RA já cadastrados!');
      }

      throw error;
    }
  }

  async findAll() {
    const users = await this.prismaService.user.findMany({
      orderBy: { name: 'asc' },
    });

    return users.map((user) => this.mapUser(user));
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async findById(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado!');

    return this.mapUser(user);
  }

  async updateById(updateUserData: UpdateUserDto, userId: string) {
    await this.findById(userId);

    const payload = { ...updateUserData };

    if (payload.password) {
      payload.password = bcrypt.hashSync(payload.password, 10);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: payload,
    });

    return this.mapUser(updatedUser);
  }

  async updateRole(
    userId: string,
    role: 'aluno' | 'professor' | 'funcionario' | 'admin' | 'monitor',
  ) {
    const current = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!current) throw new NotFoundException('Usuário não encontrado!');

    if (current.role === 'admin' && role !== 'admin') {
      const adminCount = await this.prismaService.user.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        throw new ConflictException(
          'O sistema precisa manter ao menos um administrador.',
        );
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { role },
    });

    return this.mapUser(updatedUser);
  }

  async deleteById(userId: string) {
    const user = await this.findById(userId);

    if (user.tipo === 'admin') {
      const adminCount = await this.prismaService.user.count({
        where: { role: 'admin' },
      });

      if (adminCount <= 1) {
        throw new ConflictException(
          'O último administrador não pode ser removido.',
        );
      }
    }

    await this.prismaService.user.delete({ where: { id: userId } });
  }

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    ra?: string | null;
    role: 'aluno' | 'professor' | 'funcionario' | 'admin' | 'monitor';
    password?: string;
  }) {
    return {
      id: user.id,
      nome: user.name,
      email: user.email,
      telefone: user.phone,
      ra: user.ra ?? undefined,
      tipo: user.role,
      role: user.role,
      name: user.name,
      phone: user.phone,
      password: undefined,
    };
  }
}
