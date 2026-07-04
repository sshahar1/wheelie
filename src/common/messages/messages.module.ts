import { Global, Module } from '@nestjs/common';
import { ReplyFormatter } from './reply-formatter';

@Global()
@Module({
  providers: [ReplyFormatter],
  exports: [ReplyFormatter],
})
export class MessagesModule {}
