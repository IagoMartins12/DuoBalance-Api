import { Module } from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { TaskTemplateController } from './task-template.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TaskTemplateController],
  providers: [TaskTemplateService, PrismaService],
  exports: [TaskTemplateService],
})
export class TaskTemplateModule {}
