import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Valkey from 'iovalkey';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'VALKEY_CLIENT',
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('VALKEY_URL') || 'redis://localhost:6379';
        return new Valkey(url);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['VALKEY_CLIENT'],
})
export class ValkeyModule {}
