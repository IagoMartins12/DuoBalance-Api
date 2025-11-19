import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { DreamsController } from './dreams.controller';
import { GoalsService } from './goals.service';
import { DreamsService } from './dreams.service';
import { ContributionService } from './contribution.service';

import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, NotificationsModule],
  controllers: [GoalsController, DreamsController],
  providers: [GoalsService, DreamsService, ContributionService],
  exports: [GoalsService, DreamsService, ContributionService],
})
export class GoalsModule {}
