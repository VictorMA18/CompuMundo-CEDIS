import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Error interno del servidor';

    // 1. Si es un error HTTP conocido (ej. 404, 401)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } 
    // 2. Si es un error de Prisma
    else if (exception && (exception as any).clientVersion) { // Los errores de Prisma suelen tener clientVersion
      status = HttpStatus.BAD_REQUEST;
      message = (exception as any).message || 'Error de base de datos';
    }
    // 3. Si es un Error genérico de JavaScript (IMPORTANTE: Esto arregla el {})
    else if (exception instanceof Error) {
      message = exception.message; 
    }

    // Imprime el error en la consola del servidor para que tú lo veas
    console.error('ERROR CAPTURADO:', exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message, // Ahora sí enviará el texto
    });
  }
}