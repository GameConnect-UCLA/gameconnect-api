import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostDetailResponseDto } from './dto/post-response.dto';
import { PostIDto } from './dto/post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

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
