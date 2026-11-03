import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const user = await this.userService.findByEmail(signInDto.email.trim().toLowerCase());

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = bcrypt.compareSync(signInDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token ausente.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    role: 'aluno' | 'professor' | 'funcionario' | 'admin' | 'monitor';
    name: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessTokenExpiresIn = (process.env.JWT_EXPIRES_IN as any) ?? '15m';
    const refreshTokenExpiresIn = (process.env.JWT_REFRESH_TTL as any) ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

