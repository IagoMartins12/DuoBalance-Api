// src/common/swagger/swagger.decorators.ts
import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

export function ApiAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' }),
  );
}

export function ApiOperationSummary(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary,
      description,
    }),
  );
}

export function ApiOk(type: any, description?: string) {
  return applyDecorators(
    ApiOkResponse({
      description: description ?? 'Operação realizada com sucesso',
      type,
    }),
  );
}

export function ApiCreated(type: any, description?: string) {
  return applyDecorators(
    ApiCreatedResponse({
      description: description ?? 'Recurso criado com sucesso',
      type,
    }),
  );
}

export function ApiStandardErrors() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Parâmetros inválidos' }),
    ApiForbiddenResponse({ description: 'Acesso negado' }),
    ApiNotFoundResponse({ description: 'Recurso não encontrado' }),
  );
}
