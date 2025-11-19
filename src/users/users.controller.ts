import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import * as userType from 'src/auth/types/user.type';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from '../common/swagger/swagger.decorators';
import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Iago Martins' })
  name: string;

  @ApiProperty({ required: false, nullable: true })
  photo?: string | null;

  @ApiProperty({
    example: '#FF9900',
  })
  color: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperationSummary(
    'Obter usuário logado',
    'Retorna os dados básicos do usuário autenticado.',
  )
  @ApiOkResponse({ type: MeResponseDto })
  @ApiStandardErrors()
  me(@CurrentUser() user: userType.AuthUser): MeResponseDto {
    // o CurrentUser já retorna no formato esperado
    return user as MeResponseDto;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiOperationSummary(
    'Atualizar usuário logado',
    'Atualiza os dados do usuário autenticado.',
  )
  @ApiOkResponse({ type: MeResponseDto })
  @ApiStandardErrors()
  updateMe(
    @CurrentUser() user: userType.AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<MeResponseDto> {
    return this.usersService.update(
      user.id,
      updateUserDto,
    ) as Promise<MeResponseDto>;
  }
}
