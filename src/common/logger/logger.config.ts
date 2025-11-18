import { Params } from 'nestjs-pino';

export const loggerConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined // JSON puro — ideal para logs estruturados
        : {
            target: 'pino-pretty', // logs mais bonitos no dev
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
    quietReqLogger: true, // evita logs repetidos
    customSuccessMessage: () => '✓ Request OK',
    customErrorMessage: () => '✗ Request ERROR',
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
    },
  },
};
