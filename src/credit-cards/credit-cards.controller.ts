import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Req,
  Body,
  Param,
} from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DeleteCardResponseDto } from './dto/delete-credit-card.dto';

@ApiTags('Credit Cards')
@ApiBearerAuth()
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly service: CreditCardsService) {}

  // CREATE
  @Post()
  @ApiOperation({ summary: 'Cria um cartão de crédito' })
  @ApiResponse({ status: 201, description: 'Cartão criado com sucesso' })
  createCard(@Req() req, @Body() dto: CreateCreditCardDto) {
    return this.service.createCard(req.user.id, dto);
  }

  // LIST
  @Get()
  @ApiOperation({ summary: 'Lista todos os cartões do usuário' })
  listCards(@Req() req) {
    return this.service.listCards(req.user.id);
  }

  // UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um cartão de crédito' })
  @ApiParam({ name: 'id', description: 'ID do cartão' })
  updateCard(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.service.updateCard(req.user.id, id, dto);
  }

  // DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um cartão de crédito' })
  @ApiParam({ name: 'id' })
  @ApiResponse({
    status: 200,
    description: 'Cartão desativado',
    type: DeleteCardResponseDto,
  })
  deleteCard(@Req() req, @Param('id') id: string) {
    return this.service.softDeleteCard(req.user.id, id);
  }

  // ADD TRANSACTION
  @Post(':id/transactions')
  @ApiOperation({ summary: 'Adiciona uma compra ao cartão' })
  addTransaction(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AddTransactionDto,
  ) {
    return this.service.addTransaction(req.user.id, id, dto);
  }

  // PAY INSTALLMENT
  @Patch(':id/transactions/:installmentId/pay')
  @ApiOperation({ summary: 'Marca uma parcela como paga' })
  payInstallment(
    @Req() req,
    @Param('id') cardId: string,
    @Param('installmentId') installmentId: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.service.payInstallment(req.user.id, cardId, installmentId, dto);
  }
}
