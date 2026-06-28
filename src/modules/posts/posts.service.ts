import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LikePostDto } from './dto/like-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostIDto } from './dto/post.dto';
import { CreateCommentDto, PostCommentsQueryDto } from './dto/post-comments-query.dto';
import { PostsByUserParamsDto } from './dto/posts-by-user-params.dto';
import { UpdatePostContentDto } from './dto/update-post-content.dto';
import { BookmarksQueryDto } from './dto/bookmarks-query.dto';
import { FavoriteType } from '../../generated/prisma/enums';
import { MediaService } from '../media/media.service';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private mediaService: MediaService,
    ) { }

    async createPost(userId: string, dto: CreatePostDto) {
        await this.checkUserExists(userId);

        return this.prisma.post.create({
            data: {
                author: userId,
                title: dto.title ?? null,
                content: dto.content ?? null,
                media: dto.media ?? null,
                hashtags: dto.hashtags ?? [],
                isReview: dto.isReview ?? null,
                isRepost: dto.isRepost ?? null,
                reviewedGame: dto.reviewedGame ?? null,
                reviewScore: dto.reviewScore ?? null,
                originalPostId: null,
                likesCounter: 0,
                commentsCounter: 0,
                createdAt: new Date(),
                lastModifiedAt: new Date(),
            },
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });
    }

    async updatePostContent(userId: string, dto: PostIDto, body: UpdatePostContentDto) {
        await this.getPostForModification(dto.id, userId, 'edit');

        return this.prisma.post.update({
            where: { id: dto.id },
            data: {
                content: body.content,
                lastModifiedAt: new Date(),
            },
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });
    }

    async createComment(userId: string, dto: PostIDto, body: CreateCommentDto) {
        await this.checkUserExists(userId);
        await this.checkPostExists(dto.id);

        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.create({
                data: {
                    author: userId,
                    parentId: dto.id,
                    content: body.content,
                    media: body.media,
                },
                select: { id: true, author: true, parentId: true, content: true, media: true },
            });

            await tx.post.update({
                where: { id: dto.id },
                data: {
                    commentsCounter: {
                        increment: 1,
                    },
                },
            });

            return comment;
        });
    }

    async toggleLike(userId: string, dto: LikePostDto) {
        const user = await this.checkUserExists(userId);
        await this.checkPostExists(dto.postId);

        const existingLike = await this.prisma.like.findFirst({
            where: {
                userId,
                postId: dto.postId,
            },
            select: { id: true },
        });

        if (existingLike) {
            const updated = await this.prisma.$transaction(async (transaction) => {
                await transaction.like.delete({
                    where: { id: existingLike.id },
                });

                return transaction.post.update({
                    where: { id: dto.postId },
                    data: {
                        likesCounter: {
                            decrement: 1,
                        },
                    },
                    select: { id: true, likesCounter: true },
                });
            });

            return {
                postId: updated.id,
                userId,
                username: user.username,
                liked: false
            };
        }

        const updated = await this.prisma.$transaction(async (transaction) => {
            await transaction.like.create({
                data: {
                    userId,
                    postId: dto.postId,
                },
            });

            return transaction.post.update({
                where: { id: dto.postId },
                data: {
                    likesCounter: {
                        increment: 1,
                    },
                },
                select: { id: true, likesCounter: true },
            });
        });

        return {
            postId: updated.id,
            userId,
            username: user.username,
            liked: true
        };
    }

    async getPostsByUser(dto: PostsByUserParamsDto) {
        await this.checkUserExists(dto.userId);

        const posts = await this.prisma.post.findMany({
            where: {
                author: dto.userId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            skip: dto.offset,
            take: dto.limit,
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });

        if (posts.length === 0) {
            throw new NotFoundException('No se han encontrado resultados');
        }

        return posts;
    }

    async getPostComments(dto: PostIDto, query: PostCommentsQueryDto): Promise<any[]> {
        await this.checkPostExists(dto.id);

        const comments = await this.prisma.comment.findMany({
            where: {
                parentId: dto.id,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            skip: query.offset,
            take: query.limit,
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });

        if (comments.length === 0) {
            throw new NotFoundException('No se han encontrado comentarios');
        }

        return comments;
    }

    async postDetails(dto: PostIDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: dto.id },
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return post;
    }

    async toggleBookmark(userId: string, postId: string) {
        await this.checkUserExists(userId);
        await this.checkPostExists(postId, true);

        const existingFavorite = await this.prisma.favorite.findFirst({
            where: {
                userId,
                itemId: postId,
                itemType: FavoriteType.POST,
            },
            select: { id: true },
        });

        if (existingFavorite) {
            await this.prisma.favorite.delete({
                where: { id: existingFavorite.id },
            });

            return {
                postId,
                userId,
                bookmarked: false,
            };
        }

        await this.prisma.favorite.create({
            data: {
                userId,
                itemId: postId,
                itemType: FavoriteType.POST,
            },
        });

        return {
            postId,
            userId,
            bookmarked: true,
        };
    }

    async getBookmarkedPosts(userId: string, query: BookmarksQueryDto) {
        await this.checkUserExists(userId);

        const posts = await this.prisma.post.findMany({
            where: {
                deletedAt: null,
                favorites: {
                    some: {
                        userId,
                        itemType: FavoriteType.POST,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: query.offset,
            take: query.limit,
            include: {
                authorUser: {
                    select: {
                        username: true,
                        displayName: true,
                        profilePic: true,
                    },
                },
            },
        });

        if (posts.length === 0) {
            throw new NotFoundException('No se han encontrado posts favoritos');
        }

        return posts;
    }

    async deletePost(userId: string, postId: string) {
        const post = await this.getPostForModification(postId, userId, 'delete');

        await this.prisma.$transaction(async (tx) => {
            await tx.like.deleteMany({
                where: { postId },
            });

            await tx.comment.deleteMany({
                where: { parentId: postId },
            });

            await tx.favorite.deleteMany({
                where: {
                    itemId: postId,
                    itemType: FavoriteType.POST,
                },
            });

            await tx.post.updateMany({
                where: { originalPostId: postId },
                data: { originalPostId: null },
            });

            await tx.post.delete({
                where: { id: postId },
            });
        });

        const urlsToDelete: string[] = [];
        if (post.media && typeof post.media === 'object') {
            const mediaObj = post.media as any;
            if (Array.isArray(mediaObj.urls)) {
                for (const u of mediaObj.urls) {
                    if (typeof u === 'string') urlsToDelete.push(u);
                }
            } else if (typeof mediaObj.url === 'string') {
                urlsToDelete.push(mediaObj.url);
            }
        } else if (typeof post.media === 'string') {
            urlsToDelete.push(post.media);
        }

        for (const url of urlsToDelete) {
            try {
                await this.mediaService.remove(url);
            } catch (error) {
                console.error(`Failed to remove media file: ${url}`, error);
            }
        }

        return { message: 'Post and associated assets deleted successfully' };
    }

    private async getPostForModification(postId: string, userId: string, operation: 'edit' | 'delete') {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                deletedAt: null,
            },
            select: {
                id: true,
                author: true,
                createdAt: true,
                media: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.author !== userId) {
            throw new ForbiddenException(`Only the author can ${operation} this post`);
        }

        if (!post.createdAt) {
            throw new ForbiddenException(`This post cannot be ${operation}ed`);
        }

        const creationTimeMs = new Date(post.createdAt).getTime();
        const timeWindowMs = 24 * 60 * 60 * 1000;
        if (Date.now() - creationTimeMs > timeWindowMs) {
            throw new ForbiddenException(`The 24-hour ${operation} window has expired`);
        }

        return post;
    }

    private async checkUserExists(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return user;
    }

    private async checkPostExists(postId: string, checkDeleted = false) {
        const post = await this.prisma.post.findFirst({
            where: {
                id: postId,
                ...(checkDeleted ? { deletedAt: null } : {}),
            },
            select: { id: true },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }
}
