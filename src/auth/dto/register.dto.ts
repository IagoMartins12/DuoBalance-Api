import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'E-mail do usuário. Deve ser único.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'minhasenha123',
    description: 'Senha com no mínimo 6 caracteres.',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Iago Martins',
    description: 'Nome exibido do usuário.',
  })
  @IsString()
  name: string;
}
