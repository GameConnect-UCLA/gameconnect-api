import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsUUID } from 'class-validator';

export class FeedParamsDto {

    @ApiProperty({ required: true, description: 'ID from the user to get personal feed' })
    @IsUUID()
    userId: string;

    @ApiProperty({ required: true, default: 10, minimum: 1, description: 'Number of posts to return' })
    @IsInt()
    limit: number = 10;

    @ApiProperty({ required: true, default: 0, minimum: 0, description: 'Offset for pagination' })
    @IsInt()
    offset: number = 0;
}