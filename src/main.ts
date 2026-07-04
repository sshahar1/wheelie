import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json, Request } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Capture the raw request body so SignatureGuard can verify Meta's HMAC
  // signature against the exact bytes Meta signed (contracts/whatsapp-webhook.md §2).
  app.use(
    json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
