import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MeiliService } from '../meili/meili.service';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly INDEX_NAME = 'explorer';

  constructor(
    private readonly prisma: PrismaService,
    private readonly meiliService: MeiliService,
  ) {}

  async onModuleInit() {
    try {
      const client = this.meiliService.getClient();

      // Asegurar que el índice existe o crearlo
      const index = client.index(this.INDEX_NAME);

      // Configurar ajustes del índice explorer
      await index.updateSettings({
        filterableAttributes: ['type', 'hashtags'],
        searchableAttributes: [
          'title',
          'content',
          'name',
          'username',
          'displayName',
          'searchableText',
        ],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'rankingScore:desc', // Regla de desempate por tipo (Post > Juego > Usuario)
          'exactness',
        ],
      });

      this.logger.log(
        `Meilisearch index '${this.INDEX_NAME}' settings configured successfully.`,
      );
    } catch (error) {
      this.logger.error(
        `Error configuring Meilisearch index '${this.INDEX_NAME}':`,
        error,
      );
    }
  }

  /**
   * Realiza una búsqueda global o filtrada en el índice explorer.
   */
  async search(params: {
    q?: string;
    type?: string;
    hashtag?: string;
    limit?: number;
    offset?: number;
  }) {
    const client = this.meiliService.getClient();
    const index = client.index(this.INDEX_NAME);

    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    const filters: string[] = [];

    if (params.type) {
      filters.push(`type = ${params.type}`);
    }

    if (params.hashtag) {
      filters.push(`hashtags = ${params.hashtag}`);
    }

    const searchParams: any = {
      limit,
      offset,
    };

    if (filters.length > 0) {
      searchParams.filter = filters.join(' AND ');
    }

    const result = await index.search(params.q || '', searchParams);
    return {
      hits: result.hits,
      total: result.estimatedTotalHits ?? result.hits.length,
      limit: result.limit,
      offset: result.offset,
    };
  }

  /**
   * Sincronización Inicial (Bulk/Seed): Lee todos los registros de la BD y los inyecta en Meilisearch.
   */
  async syncLocalDatabase() {
    const client = this.meiliService.getClient();
    const index = client.index(this.INDEX_NAME);

    this.logger.log('Starting bulk synchronization to Meilisearch...');

    // 1. Obtener Posts
    const posts = await this.prisma.post.findMany({
      where: { deletedAt: null },
    });

    // 2. Obtener Usuarios
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });

    // 3. Obtener Juegos
    const games = await this.prisma.game.findMany();

    const documents: any[] = [];

    // Mapear Posts
    for (const post of posts) {
      documents.push(this.mapPostToDocument(post));
    }

    // Mapear Usuarios
    for (const user of users) {
      documents.push(this.mapUserToDocument(user));
    }

    // Mapear Juegos
    for (const game of games) {
      documents.push(this.mapGameToDocument(game));
    }

    if (documents.length > 0) {
      // Inyectar documentos
      const task = await index.addDocuments(documents);
      this.logger.log(
        `Bulk synchronization queued. Meilisearch Task ID: ${task.taskUid}. Indexed ${documents.length} documents.`,
      );
      return {
        message: 'Synchronization task successfully queued',
        taskUid: task.taskUid,
        documentCount: documents.length,
      };
    }

    return { message: 'No documents found to synchronize', documentCount: 0 };
  }

  /**
   * Sincroniza un post en tiempo real.
   */
  async indexPost(post: any) {
    try {
      const client = this.meiliService.getClient();
      const doc = this.mapPostToDocument(post);
      await client.index(this.INDEX_NAME).addDocuments([doc]);
      this.logger.log(`Indexed post ${post.id} successfully.`);
    } catch (error) {
      this.logger.error(`Failed to index post ${post.id}:`, error);
    }
  }

  /**
   * Elimina un post del índice.
   */
  async deletePost(postId: string) {
    try {
      const client = this.meiliService.getClient();
      await client.index(this.INDEX_NAME).deleteDocument(postId);
      this.logger.log(`Deleted post ${postId} from index.`);
    } catch (error) {
      this.logger.error(`Failed to delete post ${postId} from index:`, error);
    }
  }

  /**
   * Sincroniza un usuario en tiempo real (para uso de otros desarrolladores).
   */
  async indexUser(user: any) {
    try {
      const client = this.meiliService.getClient();
      const doc = this.mapUserToDocument(user);
      await client.index(this.INDEX_NAME).addDocuments([doc]);
      this.logger.log(`Indexed user ${user.id} successfully.`);
    } catch (error) {
      this.logger.error(`Failed to index user ${user.id}:`, error);
    }
  }

  /**
   * Sincroniza un juego en tiempo real (si es necesario).
   */
  async indexGame(game: any) {
    try {
      const client = this.meiliService.getClient();
      const doc = this.mapGameToDocument(game);
      await client.index(this.INDEX_NAME).addDocuments([doc]);
      this.logger.log(`Indexed game ${game.id} successfully.`);
    } catch (error) {
      this.logger.error(`Failed to index game ${game.id}:`, error);
    }
  }

  // --- Mapeadores Auxiliares ---

  private mapPostToDocument(post: any) {
    const title = post.title || '';
    const content = post.content || '';
    const hashtags = post.hashtags || [];
    return {
      id: post.id,
      type: 'post',
      rankingScore: 3,
      title,
      content,
      searchableText: `${title} ${content} ${hashtags.join(' ')}`.trim(),
      hashtags,
      media: post.media || null,
    };
  }

  private mapUserToDocument(user: any) {
    const username = user.username || '';
    const displayName = user.displayName || '';
    const bio = user.bio || '';
    return {
      id: user.id,
      type: 'user',
      rankingScore: 1,
      username,
      displayName,
      bio,
      profilePic: user.profilePic || '',
      verified: user.verified || false,
      searchableText: `${username} ${displayName} ${bio}`.trim(),
    };
  }

  private mapGameToDocument(game: any) {
    const metadata = game.metadata || {};
    const name = metadata.name || '';
    const description = metadata.description || '';
    const coverImage = metadata.cover_url || metadata.coverImage || '';
    return {
      id: game.id,
      type: 'game',
      rankingScore: 2,
      name,
      metadata: {
        description,
        coverImage,
      },
      score: game.score || null,
      searchableText: `${name} ${description}`.trim(),
    };
  }
}
