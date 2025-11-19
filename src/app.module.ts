import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';
import { IncomesModule } from './incomes/incomes.module';
import { LoggerModule } from './common/logger/logger.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RecurringJobsService } from './recurring-jobs/recurring-jobs.service';
import { SplitService } from './split/split.service';
import { EquityModule } from './equity/equity.module';
import { TaskTemplateModule } from './task-template/task-template.module';
import { DomesticTaskEntryModule } from './domestic-task-entry/domestic-task-entry.module';
import { DomesticEquityModule } from './domestic-equity/domestic-equity.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { BudgetModule } from './budget/budget.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    HouseholdsModule,
    IncomesModule,
    LoggerModule,
    ExpensesModule,
    EquityModule,
    TaskTemplateModule,
    DomesticTaskEntryModule,
    DomesticEquityModule,
    CreditCardsModule,
    BudgetModule,
    NotificationsModule,
    GoalsModule,
  ],
  providers: [RecurringJobsService, SplitService],
})
export class AppModule {}
