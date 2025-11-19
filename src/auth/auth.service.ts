import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto, AuthUser } from './types/user.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // REGISTER
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        // se o campo "color" for obrigatório no schema, defina algo aqui:
        // color: '#FF9900',
      },
    });

    return this.generateToken(user.id);
  }

  // LOGIN
  async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateToken(user.id);
  }

  // Gera o token + monta o objeto de usuário para o AuthResponseDto
  async generateToken(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        photo: true,
        color: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const payload = { sub: user.id };

    const accessToken = await this.jwt.signAsync(payload);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo ?? null,
      color: user.color ?? '#FF9900', // fallback caso venha null/undefined
    };

    return {
      accessToken,
      user: authUser,
    };
  }
}
