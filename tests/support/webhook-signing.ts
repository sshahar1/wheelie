import { createHmac } from 'crypto';

export function signPayload(secret: string, rawBody: string): string {
  return `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

export interface SignedRequest {
  /**
   * The exact serialized string to pass to supertest's `.send()`. Must be
   * sent as a string, not a Buffer — superagent JSON-encodes Buffer bodies
   * (wrapping them as `{"type":"Buffer","data":[...]}`) when Content-Type is
   * application/json, which would sign different bytes than what the server
   * actually receives.
   */
  rawBody: string;
  signature: string;
}

export function buildSignedRequest(payload: unknown, secret: string): SignedRequest {
  const serialized = JSON.stringify(payload);
  return {
    rawBody: serialized,
    signature: signPayload(secret, serialized),
  };
}
