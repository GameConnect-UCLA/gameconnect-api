import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { SearchService } from '../search/search.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      post: { findMany: jest.fn(), findFirst: jest.fn() },
      comment: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MediaService, useValue: {} },
        { provide: SearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPostsByUser', () => {
    it('should return an empty array if user has no posts', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'test' });
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getPostsByUser({
        userId: 'user-1',
        offset: 0,
        limit: 10,
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getPostsByUser({
          userId: 'nonexistent',
          offset: 0,
          limit: 10,
        }),
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('getPostComments', () => {
    it('should return an empty array if post has no comments', async () => {
      prisma.post.findFirst.mockResolvedValue({ id: 'post-1' });
      prisma.comment.findMany.mockResolvedValue([]);

      const result = await service.getPostComments(
        { id: 'post-1' },
        { offset: 0, limit: 10 },
      );
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(
        service.getPostComments({ id: 'post-1' }, { offset: 0, limit: 10 }),
      ).rejects.toThrow('Post not found');
    });
  });

  describe('getBookmarkedPosts', () => {
    it('should return an empty array if user has no bookmarked posts', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'test' });
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getBookmarkedPosts('user-1', {
        offset: 0,
        limit: 10,
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getBookmarkedPosts('nonexistent', { offset: 0, limit: 10 }),
      ).rejects.toThrow('Usuario no encontrado');
    });
  });
});
