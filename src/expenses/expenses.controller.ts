import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import * as userType from 'src/auth/types/user.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @CurrentUser() user: userType.AuthUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: userType.AuthUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('isIndividual') isIndividual?: string,
  ) {
    const filters: {
      month?: number;
      year?: number;
      category?: ExpenseCategory;
      isIndividual?: boolean;
    } = {};

    if (month) filters.month = Number(month);
    if (year) filters.year = Number(year);
    if (category) filters.category = category;
    if (typeof isIndividual === 'string') {
      filters.isIndividual = isIndividual === 'true';
    }

    return this.expensesService.findAll(user.id, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: userType.AuthUser, @Param('id') id: string) {
    return this.expensesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: userType.AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: userType.AuthUser, @Param('id') id: string) {
    return this.expensesService.remove(user.id, id);
  }
}
