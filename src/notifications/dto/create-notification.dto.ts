import { NotificationType, NotificationEntity } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID da household associada à notificação.',
    example: '675f8a3bbd0b5d3a9c0f1234',
  })
  @IsString()
  householdId: string;

  @ApiPropertyOptional({
    description:
      'ID do usuário. Opcional: se omitido, a notificação pode ser geral para a household.',
    example: '665f7b0d9a2c0f1a2b3c4d5e',
  })
  @IsOptional()
  @IsString()
  userId?: string; // opcional: notificação pode ser geral ou para usuário específico

  @ApiProperty({
    description: 'Título da notificação.',
    example: 'Aviso de orçamento',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Mensagem detalhada da notificação.',
    example: 'Seu orçamento de mercado atingiu 85% do valor definido.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Tipo da notificação.',
    example: NotificationType.BUDGET_WARNING,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'ID do recurso relacionado (ex: orçamento, despesa, tarefa).',
    example: '675f8a3bbd0b5d3a9c0f9999',
  })
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiPropertyOptional({
    enum: NotificationEntity,
    description:
      'Tipo do recurso relacionado (BUDGET, EXPENSE, TASK, DREAM, GOAL, etc).',
    example: NotificationEntity.BUDGET,
  })
  @IsOptional()
  @IsEnum(NotificationEntity)
  relatedType?: NotificationEntity;
}
