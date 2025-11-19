import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, PrismaService, ExpensesService],
  exports: [BudgetService],
  imports: [NotificationsModule],
})
export class BudgetModule {}
