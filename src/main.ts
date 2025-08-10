import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { validationExceptionFormatter } from './utils/validation-exception-formatter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: ['debug', 'error', 'verbose', 'warn', 'log'],
  });

  // Set raw body parsing for Stripe webhooks
  app.use(
    '/api/v1/subscription/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
  app.use(
    '/api/v1/plans/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );
  app.use(
    '/api/v1/webhooks/facebook',
    bodyParser.raw({ type: 'application/json' }),
  );

  app.enableCors();
  app.useBodyParser('json', { limit: '50mb' });
  app.useBodyParser('urlencoded', { limit: '50mb', extended: true });
  app.useStaticAssets('public');
  app.setGlobalPrefix('/api/v1');
  app.use(cookieParser("anonymous_id"));
  app.set('trust proxy', true);


  // The validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // ** OVERRIDE THE STATUS
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFormatter,
    }),
  );

  useContainer(app.select(AppModule), {
    fallbackOnErrors: true,
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      `Server is running on  http://localhost:${process.env.PORT ?? 3000}`,
    );
  });
}
bootstrap();
