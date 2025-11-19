import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'E-mail cadastrado do usuário.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'minhasenha123',
    description: 'Senha do usuário.',
    minLength: 6,
  })
  @MinLength(6)
  password: string;
}
