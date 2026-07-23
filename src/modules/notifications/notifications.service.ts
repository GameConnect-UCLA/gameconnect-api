import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventType } from '../../generated/prisma/enums';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Método genérico para que lo llamen los servicios de Likes y Comentarios
  async createNotification(userId: string, type: EventType, payload: any) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        payload,
        read: false,
      },
    });
  }

  // Obtener historial del usuario
  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Marcar como leída
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}