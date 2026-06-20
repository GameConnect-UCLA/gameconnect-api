import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedPostResponseDto } from '../feed/dto/feed-response.dto';
import { LikeResponseDto } from './dto/like-response.dto';
import { LikePostDto } from './dto/like-post.dto';
import { PostDetailResponseDto } from './dto/post-response.dto';
import { PostIDto } from './dto/post.dto';
import { PostsByUserParamsDto } from './dto/posts-by-user-params.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    async toggleLike(userId: string, dto: LikePostDto): Promise<LikeResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const post = await this.prisma.post.findUnique({
            where: { id: dto.postId },
            select: { id: true, likesCounter: true },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

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
                liked: false,
                likesCounter: updated.likesCounter,
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
            liked: true,
            likesCounter: updated.likesCounter,
        };
    }

    async getPostsByUser(dto: PostsByUserParamsDto): Promise<FeedPostResponseDto[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

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

        return posts.map((post) => ({
            id: post.id,
            author: post.author,
            originalPostId: post.originalPostId,
            title: post.title,
            content: post.content,
            media: post.media,
            hashtags: post.hashtags,
            isReview: post.isReview,
            isRepost: post.isRepost,
            reviewedGame: post.reviewedGame,
            reviewScore: post.reviewScore,
            likesCounter: post.likesCounter,
            commentsCounter: post.commentsCounter,
            createdAt: post.createdAt,
            lastModifiedAt: post.lastModifiedAt,
            deletedAt: post.deletedAt,
            authorUsername: post.authorUser.username,
            authorDisplayName: post.authorUser.displayName,
            authorProfilePic: post.authorUser.profilePic,
        }));
    }

    async postDetails(dto: PostIDto): Promise<PostDetailResponseDto> {
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
                comments: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        authorUser: {
                            select: {
                                username: true,
                                displayName: true,
                                profilePic: true,
                            },
                        },
                    },
                },
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return {
            id: post.id,
            author: post.author,
            originalPostId: post.originalPostId,
            title: post.title,
            content: post.content,
            media: post.media,
            hashtags: post.hashtags,
            isReview: post.isReview,
            isRepost: post.isRepost,
            reviewedGame: post.reviewedGame,
            reviewScore: post.reviewScore,
            likesCounter: post.likesCounter,
            commentsCounter: post.commentsCounter,
            createdAt: post.createdAt,
            lastModifiedAt: post.lastModifiedAt,
            deletedAt: post.deletedAt,
            authorUsername: post.authorUser.username,
            authorDisplayName: post.authorUser.displayName,
            authorProfilePic: post.authorUser.profilePic,
            comments: post.comments.map((comment) => ({
                id: comment.id,
                parentId: comment.parentId,
                commentParentId: comment.commentParentId,
                content: comment.content,
                createdAt: comment.createdAt,
                authorUsername: comment.authorUser.username,
                authorDisplayName: comment.authorUser.displayName,
                authorProfilePic: comment.authorUser.profilePic,
            })),
        };
    }
}
