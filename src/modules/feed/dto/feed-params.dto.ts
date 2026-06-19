import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsUUID } from 'class-validator';

export class FeedParamsDto {

    @ApiProperty({ description: 'ID del usuario para obtener el feed' })
    @IsUUID()
    userId: string;

    @ApiProperty({ required: false, default: 10, minimum: 1 })
    @IsInt()
    limit: number = 10;

    @ApiProperty({ required: false, default: 0, minimum: 0 })
    @IsInt()
    offset: number = 0;
}