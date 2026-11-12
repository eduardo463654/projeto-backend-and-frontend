import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userService = {
    findByEmail: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an access token and user data for valid credentials', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@aluno.com',
      password: 'hashed-password',
      role: 'aluno',
    });

    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const service = new AuthService(userService as any, jwtService as any);

    const result = await service.signIn({
      email: 'ANA@ALUNO.COM',
      password: 'senha123',
    });

    expect(result.access_token).toBe('jwt-token');
    expect(result.refresh_token).toBe('jwt-token');
    expect(result.user.role).toBe('aluno');
  });

  it('throws unauthorized for an invalid password', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 'user-2',
      name: 'Bruno',
      email: 'bruno@professor.com',
      password: 'hashed',
      role: 'professor',
    });

    jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

    const service = new AuthService(userService as any, jwtService as any);

    await expect(
      service.signIn({
        email: 'bruno@professor.com',
        password: 'senhaerrada',
      }),
    ).rejects.toThrow('Credenciais inválidas.');
  });
});
