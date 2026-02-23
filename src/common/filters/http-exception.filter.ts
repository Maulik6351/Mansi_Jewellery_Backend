import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isProduction = process.env.NODE_ENV === 'production';

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'Internal server error' };

        const message =
            typeof exceptionResponse === 'object' && (exceptionResponse as any).message
                ? (exceptionResponse as any).message
                : exceptionResponse;

        const logMessage = `${request.method} ${request.url} ${status} - Error: ${JSON.stringify(message)}`;

        if (status >= 500) {
            this.logger.error(logMessage, exception instanceof Error ? exception.stack : '');
        } else if (status >= 400) {
            this.logger.warn(logMessage);
        } else {
            this.logger.log(logMessage);
        }


        response.status(status).json({
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
            ...(isProduction ? {} : { stack: exception instanceof Error ? exception.stack : null }),
        });
    }
}
