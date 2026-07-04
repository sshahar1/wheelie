export interface AppConfig {
  databaseUrl: string;
  whatsapp: {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    appSecret: string;
    activationKeyword: string;
  };
  openaiApiKey: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadAppConfig(): AppConfig {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    whatsapp: {
      accessToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),
      phoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
      verifyToken: requireEnv('WHATSAPP_VERIFY_TOKEN'),
      appSecret: requireEnv('WHATSAPP_APP_SECRET'),
      activationKeyword: process.env.WHATSAPP_ACTIVATION_KEYWORD ?? '@bot',
    },
    openaiApiKey: requireEnv('OPENAI_API_KEY'),
  };
}
