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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from '../common/swagger/swagger.decorators';
import { ApiQuery } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

// --------------------
// Response DTO
// --------------------
export class ExpenseResponseDto {
  @ApiProperty({
    example: '675f8a3bbd0b5d3a9c0f1234',
  })
  id: string;

  @ApiProperty({
    example: 'Mercado do mês',
  })
  description: string;

  @ApiProperty({
    example: 350.75,
  })
  amount: number;

  @ApiProperty({
    enum: ExpenseCategory,
    example: ExpenseCategory.GROCERIES,
  })
  category: ExpenseCategory;

  @ApiProperty({
    example: '2025-11-17T00:00:00.000Z',
  })
  date: string | Date;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: false,
  })
  isIndividual: boolean;

  @ApiProperty({
    example: '675f8a3bbd0b5d3a9c0f9999',
    nullable: true,
    required: false,
  })
  creditCardId?: string | null;

  @ApiProperty({
    example: '2025-11-17T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-11-17T12:05:00.000Z',
  })
  updatedAt: Date;
}

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperationSummary(
    'Criar despesa',
    'Cria uma nova despesa (individual ou do casal).',
  )
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiStandardErrors()
  create(
    @CurrentUser() user: userType.AuthUser,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(
      user.id,
      dto,
    ) as Promise<ExpenseResponseDto>;
  }

  @Get()
  @ApiOperationSummary(
    'Listar despesas',
    'Lista despesas da household do usuário com filtros opcionais.',
  )
  @ApiQuery({
    name: 'month',
    required: false,
    example: '11',
    description: 'Mês (1-12) para filtrar.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    example: '2025',
    description: 'Ano para filtrar.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ExpenseCategory,
    description: 'Filtra pela categoria da despesa.',
  })
  @ApiQuery({
    name: 'isIndividual',
    required: false,
    example: 'true',
    description:
      'Se informado, filtra por despesas individuais (true) ou do casal (false).',
  })
  @ApiOkResponse({ type: ExpenseResponseDto, isArray: true })
  @ApiStandardErrors()
  findAll(
    @CurrentUser() user: userType.AuthUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('isIndividual') isIndividual?: string,
  ): Promise<ExpenseResponseDto[]> {
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

    return this.expensesService.findAll(user.id, filters) as Promise<
      ExpenseResponseDto[]
    >;
  }

  @Get(':id')
  @ApiOperationSummary(
    'Obter despesa',
    'Retorna os detalhes de uma despesa específica.',
  )
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiStandardErrors()
  findOne(
    @CurrentUser() user: userType.AuthUser,
    @Param('id') id: string,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(
      user.id,
      id,
    ) as Promise<ExpenseResponseDto>;
  }

  @Patch(':id')
  @ApiOperationSummary(
    'Atualizar despesa',
    'Atualiza os dados de uma despesa existente.',
  )
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiStandardErrors()
  update(
    @CurrentUser() user: userType.AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(
      user.id,
      id,
      dto,
    ) as Promise<ExpenseResponseDto>;
  }

  @Delete(':id')
  @ApiOperationSummary(
    'Excluir despesa',
    'Remove uma despesa da household do usuário.',
  )
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiStandardErrors()
  remove(
    @CurrentUser() user: userType.AuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.expensesService.remove(user.id, id);
  }
}
