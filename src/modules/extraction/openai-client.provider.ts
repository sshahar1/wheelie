import { Provider } from '@nestjs/common';
import OpenAI from 'openai';
import { APP_CONFIG } from '../../common/config/config.module';
import { AppConfig } from '../../common/config/app-config';

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');

export const openAiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (config: AppConfig) => new OpenAI({ apiKey: config.openaiApiKey }),
  inject: [APP_CONFIG],
};
