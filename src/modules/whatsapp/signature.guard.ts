import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { APP_CONFIG } from '../../common/config/config.module';
import { AppConfig } from '../../common/config/app-config';

/**
 * Validates Meta's X-Hub-Signature-256 header against the raw request body
 * using the app secret, per contracts/whatsapp-webhook.md §2. This is the
 * trust boundary for every inbound webhook call — a bypass here would let a
 * forged request mutate the shared schedule, so signatures are rejected
 * closed (missing header or mismatch => reject) rather than open.
 */
@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const signatureHeader = request.headers['x-hub-signature-256'];

    if (typeof signatureHeader !== 'string' || !request.rawBody) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const expected = this.computeSignature(request.rawBody);
    if (!this.safeCompare(signatureHeader, expected)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }

  private computeSignature(rawBody: Buffer): string {
    const hmac = createHmac('sha256', this.config.whatsapp.appSecret);
    hmac.update(rawBody);
    return `sha256=${hmac.digest('hex')}`;
  }

  private safeCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    return timingSafeEqual(bufferA, bufferB);
  }
}
