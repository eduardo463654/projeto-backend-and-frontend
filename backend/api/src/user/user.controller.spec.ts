import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    updateRole: jest.fn(),
    deleteById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects privileged roles from public registration', () => {
    const createUser = { role: 'admin' } as CreateUserDto;

    expect(() => controller.create(createUser)).toThrow(BadRequestException);
    expect(userService.create).not.toHaveBeenCalled();
  });

  it('does not allow a regular user to update another account', () => {
    expect(() =>
      controller.updateById({} as UpdateUserDto, 'another-user', {
        sub: 'current-user',
        role: 'aluno',
      }),
    ).toThrow(ForbiddenException);
    expect(userService.updateById).not.toHaveBeenCalled();
  });
});
