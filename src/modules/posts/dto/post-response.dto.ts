import { ApiProperty } from '@nestjs/swagger';
import { PostCommentResponseDto } from './post-comment-response.dto';

export class PostDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  author: string;

  @ApiProperty({ nullable: true })
  originalPostId: string | null;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty({ nullable: true })
  content: string | null;

  @ApiProperty()
  media: any;

  @ApiProperty({ type: [String] })
  hashtags: string[];

  @ApiProperty({ nullable: true })
  isReview: boolean | null;

  @ApiProperty({ nullable: true })
  isRepost: boolean | null;

  @ApiProperty({ nullable: true })
  reviewedGame: string | null;

  @ApiProperty({ nullable: true })
  reviewScore: number | null;

  @ApiProperty({ nullable: true })
  likesCounter: number | null;

  @ApiProperty({ nullable: true })
  commentsCounter: number | null;

  @ApiProperty({ type: Date, nullable: true })
  createdAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  lastModifiedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  deletedAt: Date | null;

  // datos del autor del post
  @ApiProperty({ nullable: true })
  authorUsername: string | null;

  @ApiProperty({ nullable: true })
  authorDisplayName: string | null;

  @ApiProperty({ nullable: true })
  authorProfilePic: string | null;

  // arreglo de comentarios
  @ApiProperty({ type: [PostCommentResponseDto] })
  comments?: PostCommentResponseDto[];
}