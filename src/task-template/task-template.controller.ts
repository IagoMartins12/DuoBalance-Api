import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import * as authRequestType from 'src/auth/types/auth-request.type';

@Controller('task-templates')
export class TaskTemplateController {
  constructor(private readonly service: TaskTemplateService) {}

  @Get()
  async findAll(@Req() req: authRequestType.AuthRequest) {
    return this.service.findAllForUser(req.user.id);
  }

  @Post()
  async create(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateTaskTemplateDto,
  ) {
    return this.service.createCustom(req.user.id, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskTemplateDto,
  ) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
  ) {
    return this.service.softDelete(req.user.id, id);
  }
}
