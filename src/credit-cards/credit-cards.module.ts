import { Module } from '@nestjs/common';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';

@Module({
  controllers: [CreditCardsController],
  providers: [CreditCardsService, PrismaService, ExpensesService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
