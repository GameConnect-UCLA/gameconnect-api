import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';

@Injectable()
export class MeiliService implements OnModuleInit {
  private client: Meilisearch;
  private readonly logger = new Logger(MeiliService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MEILI_URL') || 'http://localhost:7700';
    const apiKey = this.configService.get<string>('MEILI_MASTER_KEY') || 'decanatocienciaytecnologiaucla';

    this.client = new Meilisearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    try {
      const health = await this.client.health();
      this.logger.log(`Meilisearch connection verified. Status: ${health.status}`);
    } catch (error) {
      this.logger.error('Failed to connect to Meilisearch:', error);
    }
  }

  getClient(): Meilisearch {
    return this.client;
  }
}
