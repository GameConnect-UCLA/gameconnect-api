import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, state: true, profilePic: true, verified: true,
      },
    });
  }
}
