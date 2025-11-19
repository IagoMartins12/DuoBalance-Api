import { ApiProperty } from '@nestjs/swagger';

export class AuthUser {
  @ApiProperty({ example: '665f7b0d9a2c0f1a2b3c4d5e' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Iago Martins' })
  name: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../avatar.png',
    required: false,
    nullable: true,
  })
  photo?: string | null;

  @ApiProperty({
    example: '#FF9900',
    description: 'Cor identificadora do usuário no app.',
  })
  color: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT de autenticação.',
  })
  accessToken: string;

  @ApiProperty({ type: AuthUser })
  user: AuthUser;
}
