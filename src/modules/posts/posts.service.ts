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

    async toggleLike(userId: string, dto: LikePostDto){
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

        return posts;
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

        return post;
    }
}
