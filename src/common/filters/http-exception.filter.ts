import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private isProduction(): boolean {
    return this.configService.get<string>('app.nodeEnv') === 'production';
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    // 生产环境隐藏内部错误
    if (this.isProduction()) {
      return 'Internal server error';
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const error = response as {
          message?: string | string[];
        };
        if (Array.isArray(error.message)) {
          return error.message.join(',');
        }
        return error.message ?? 'Internal server error';
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private logException(exception: unknown, request: Request, status: number) {
    const message = this.getMessage(exception);
    if (exception instanceof HttpException) {
      this.logger.warn({
        status,
        message: message,
        path: request.url,
      });
    } else if (exception instanceof Error) {
      this.logger.error({
        message: message,
        stack: exception.stack,
        path: request.url,
      });
    } else {
      this.logger.error({
        message: String(exception),
        path: request.url,
      });
    }
  }

  private createResponse(
    status: number,
    message: string,
    path: string,
  ): ErrorResponse {
    return {
      code: status,
      message,
      data: null,
      path,
      timestamp: new Date().toISOString(),
    };
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = this.getStatus(exception);
    const message = this.getMessage(exception);

    this.logException(exception, request, status);

    response
      .status(status)
      .json(this.createResponse(status, message, request.url));
  }
}

export interface ErrorResponse {
  code: number;
  message: string;
  data: null;
  path: string;
  timestamp: string;
}
