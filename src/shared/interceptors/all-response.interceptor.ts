import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { performance } from 'perf_hooks';
import { IResponse } from '../interfaces/response.interface';

@Injectable()
export class AllResponseInterceptor implements NestInterceptor {
  constructor() {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = performance.now(); // Start timer for duration

    return next.handle().pipe(
      map(async (data: IResponse) => {
        const duration = (performance.now() - start).toFixed(2); // Time in ms
        const httpStatus =
          context.switchToHttp().getResponse()?.statusCode || 200;

        // Format and return the response
        const formattedResponse = {
          status: httpStatus,
          message: data?.message || 'Success',
          ...((data?.details || data?.extra) && {
            response: {
              ...(data.details && { details: data.details }),
              ...(data.extra && { extra: data.extra }),
            },
          }),
        };

        return formattedResponse;
      }),
    );
  }
}
