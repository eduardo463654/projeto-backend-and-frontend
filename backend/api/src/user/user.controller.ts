import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    if (!['aluno', 'professor'].includes(createUserDto.role)) {
      throw new BadRequestException(
        'O cadastro público permite apenas aluno ou professor.',
      );
    }

    return this.userService.create(createUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getCurrentUser(@CurrentUser('sub') userId: string) {
    return this.userService.findById(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'funcionario')
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findById(
    @Param('id') userId: string,
    @CurrentUser() requester: { sub: string; role: string },
  ) {
    if (requester.sub !== userId && requester.role !== 'admin') {
      throw new ForbiddenException('Você não pode consultar este usuário.');
    }

    return this.userService.findById(userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  updateById(
    @Body() updateUserData: UpdateUserDto,
    @Param('id') userId: string,
    @CurrentUser() requester: { sub: string; role: string },
  ) {
    if (requester.sub !== userId && requester.role !== 'admin') {
      throw new ForbiddenException('Você não pode alterar este usuário.');
    }

    return this.userService.updateById(updateUserData, userId);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser('sub') requesterId: string,
  ) {
    if (requesterId === userId && updateUserRoleDto.role !== 'admin') {
      throw new BadRequestException(
        'Não é permitido remover seu próprio acesso admin.',
      );
    }

    return this.userService.updateRole(userId, updateUserRoleDto.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteById(
    @Param('id') userId: string,
    @CurrentUser('sub') requesterId: string,
  ) {
    if (requesterId === userId) {
      throw new BadRequestException(
        'Não é permitido remover sua própria conta.',
      );
    }

    return this.userService.deleteById(userId);
  }
}
