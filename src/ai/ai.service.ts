import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  async createAIInsight(data: {
    userId: string;
    message: string;
    tone: 'NEUTRAL' | 'ENCOURAGING' | 'CAUTIOUS' | 'CELEBRATORY' | 'GENTLE';
    type:
      | 'INSIGHT'
      | 'PREDICTION'
      | 'SUGGESTION'
      | 'WARNING'
      | 'PEACE_MODE'
      | 'POSITIVE'
      | 'TASK_BALANCE';
    context?: any;
  }) {
    return this.prisma.aIMessage.create({
      data: {
        userId: data.userId,
        message: data.message,
        type: data.type,
        tone: data.tone,
        context: data.context ?? null,
      },
    });
  }
}
