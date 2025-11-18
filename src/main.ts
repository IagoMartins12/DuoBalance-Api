import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const isProd = configService.get<string>('NODE_ENV') === 'production';

  // Segurança
  app.use(helmet());

  app.enableCors({
    origin: isProd ? ['https://seu-dominio.com'] : true,
    credentials: true,
  });

  // Pipes globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Prisma shutdown hooks
  // const prisma = app.get(PrismaService);
  // prisma.enableShutdownHooks(app);

  // Prefixo global
  app.setGlobalPrefix('v1');

  // Documentação Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DuoBalance API')
    .setDescription('Documentação oficial da API do DuoBalance')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  // Start
  await app.listen(port);

  logger.log(`🚀 DuoBalance API iniciada em http://localhost:${port}`);
  logger.log(`📘 Swagger: http://localhost:${port}/docs`);
}

bootstrap();
