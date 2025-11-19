import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import * as authRequestType from '../auth/types/auth-request.type';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from '../common/swagger/swagger.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

// Response DTO (simplificado)
export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty({ nullable: true, required: false })
  userId?: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true, required: false })
  relatedId?: string | null;

  @ApiProperty({ nullable: true, required: false })
  relatedType?: string | null;

  @ApiProperty({ default: false })
  isRead: boolean;

  @ApiProperty({ nullable: true })
  readAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperationSummary(
    'Listar notificações',
    'Lista todas as notificações do usuário autenticado.',
  )
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  @ApiStandardErrors()
  list(@Req() req: authRequestType.AuthRequest) {
    return this.notificationsService.listForUser(req.user.id) as Promise<
      NotificationResponseDto[]
    >;
  }

  @Patch(':id/read')
  @ApiOperationSummary(
    'Marcar notificação como lida',
    'Marca uma notificação específica como lida para o usuário autenticado.',
  )
  @ApiOkResponse({ type: NotificationResponseDto })
  @ApiStandardErrors()
  markAsRead(@Req() req: authRequestType.AuthRequest, @Param('id') id: string) {
    return this.notificationsService.markAsRead(
      req.user.id,
      id,
    ) as Promise<NotificationResponseDto>;
  }
}
