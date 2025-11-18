import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { JoinHouseholdDto } from './dto/join-household.dto';
import { UpdateSplitDto } from './dto/update-split.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HouseholdResponseDto } from './dto/household-response.dto';

@ApiTags('Households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova Casa Financeira' })
  @ApiResponse({
    status: 201,
    type: HouseholdResponseDto,
  })
  create(@CurrentUser() user: any, @Body() dto: CreateHouseholdDto) {
    return this.householdsService.createHousehold(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter a Casa Financeira do usuário logado' })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  getMyHousehold(@CurrentUser() user: any) {
    return this.householdsService.getMyHousehold(user.id);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Entrar em uma Casa Financeira via código de convite',
  })
  @ApiResponse({ status: 201, type: HouseholdResponseDto })
  join(@CurrentUser() user: any, @Body() dto: JoinHouseholdDto) {
    return this.householdsService.joinHousehold(user.id, dto);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Sair da Casa Financeira atual' })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  leave(@CurrentUser() user: any) {
    return this.householdsService.leaveHousehold(user.id);
  }

  @Patch(':id/split')
  @ApiOperation({
    summary: 'Atualizar forma de divisão das despesas da Casa Financeira',
  })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  updateSplit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSplitDto,
  ) {
    return this.householdsService.updateSplitMethod(user.id, id, dto);
  }
}
