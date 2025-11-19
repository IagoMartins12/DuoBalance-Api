import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiOperationSummary,
  ApiCreated,
  ApiOk,
} from '../common/swagger/swagger.decorators';
import { AuthResponseDto } from './types/user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperationSummary(
    'Registrar novo usuário',
    'Cria um usuário e retorna o token de acesso.',
  )
  @ApiCreated(AuthResponseDto, 'Usuário registrado com sucesso')
  @ApiBadRequestResponse({ description: 'Dados inválidos' })
  @ApiConflictResponse({ description: 'E-mail já está em uso' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperationSummary(
    'Login do usuário',
    'Realiza autenticação e retorna token de acesso.',
  )
  @ApiOk(AuthResponseDto, 'Login realizado com sucesso')
  @ApiBadRequestResponse({ description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }
}
