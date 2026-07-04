import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { json, Request } from 'express';
import { AppModule } from '../../src/app.module';
import { OPENAI_CLIENT } from '../../src/modules/extraction/openai-client.provider';
import { WhatsAppClientService } from '../../src/modules/whatsapp/whatsapp-client.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { ExtractionResult } from '../../src/modules/extraction/extraction.types';

export interface SentMessage {
  to: string;
  body: string;
}

export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  sentMessages: SentMessage[];
  setNextExtraction: (result: ExtractionResult) => void;
}

const TOOL_NAME = 'record_performance_intent';

export async function createTestApp(): Promise<TestAppContext> {
  const sentMessages: SentMessage[] = [];
  let nextResult: ExtractionResult | null = null;

  const mockOpenAiClient = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      name: TOOL_NAME,
                      arguments: JSON.stringify(nextResult),
                    },
                  },
                ],
              },
            },
          ],
        }),
      },
    },
  };

  const mockWhatsAppClient = {
    sendTextMessage: async (to: string, body: string) => {
      sentMessages.push({ to, body });
    },
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(OPENAI_CLIENT)
    .useValue(mockOpenAiClient)
    .overrideProvider(WhatsAppClientService)
    .useValue(mockWhatsAppClient)
    .compile();

  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.use(
    json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    sentMessages,
    setNextExtraction: (result: ExtractionResult) => {
      nextResult = result;
    },
  };
}
