import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        pronouns: true,
        birthDate: true,
        role: true,
        state: true,
        profilePic: true,
        coverPic: true,
        verified: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.pronouns !== undefined && { pronouns: dto.pronouns }),
        ...(dto.profilePic !== undefined && { profilePic: dto.profilePic }),
        ...(dto.coverPic !== undefined && { coverPic: dto.coverPic }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        pronouns: true,
        birthDate: true,
        role: true,
        state: true,
        profilePic: true,
        coverPic: true,
        verified: true,
        createdAt: true,
      },
    });
  }
}
