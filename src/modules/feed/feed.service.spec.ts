import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FeedService', () => {
  let service: FeedService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      follow: { findMany: jest.fn() },
      post: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomeFeed', () => {
    it('should return an empty array if no posts exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.follow.findMany.mockResolvedValue([]);
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getHomeFeed('user-1', {
        offset: 0,
        limit: 10,
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getHomeFeed('nonexistent', { offset: 0, limit: 10 }),
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('getTrendingFeed', () => {
    it('should return an empty array if no posts exist', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      const result = await service.getTrendingFeed({ offset: 0, limit: 10 });
      expect(result).toEqual([]);
    });
  });
});
