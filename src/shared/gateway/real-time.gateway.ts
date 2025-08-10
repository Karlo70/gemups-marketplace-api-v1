import { UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import * as dayjs from 'dayjs';
import { Server, Socket } from 'socket.io';
import { LoginAttempt } from 'src/modules/auth/entities/login-attempt.entity';
import { User, UserStatus } from 'src/modules/users/entities/user.entity';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

export enum EventType {
  NOTIFICATION = 'notification',
  MESSAGE = 'message',
}

@WebSocketGateway({ namespace: '/real-time', cors: true })
export class RealTimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealTimeGateway.name);

  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptsRepository: Repository<LoginAttempt>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  @WebSocketServer()
  server: Server;

  private readonly usersSockets = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    try {
      const { access_token } = client.handshake.auth;

      if (!access_token || typeof access_token !== 'string') {
        throw new UnauthorizedException('Access token is required');
      }

      const loginAttempt = await this.loginAttemptsRepository.findOne({
        where: {
          access_token: access_token,
          logout_at: IsNull(),
          expire_at: MoreThan(new Date()),
        },
        relations: {
          user: true,
        },
      });

      if (!loginAttempt) {
        throw new UnauthorizedException(
          'Unauthorized connection attempt: Invalid session',
        );
      }

      const user = await this.usersRepository.findOne({
        where: {
          id: loginAttempt.user.id,
          deleted_at: IsNull(),
          status: UserStatus.ACTIVE,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User does not exist or is inactive');
      }

      // Extend login expiration
      loginAttempt.expire_at = dayjs().add(1, 'month').toDate();
      await this.loginAttemptsRepository.save(loginAttempt);

      // Store multiple connections for the same user
      if (!this.usersSockets.has(user.id)) {
        this.usersSockets.set(user.id, new Set());
      }

      this.usersSockets.get(user.id)?.add(client.id);

      console.log(`✅ User ${user.id} connected to WebSocket`);
    } catch (error) {
      this.logger.error(
        `🔥 Error in WebSocket authentication: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      for (const [userId, socketSet] of this.usersSockets) {
        if (socketSet.has(client.id)) {
          socketSet.delete(client.id);
          console.log(
            `🔴 User ${userId} disconnected from socket ${client.id}`,
          );

          // If no active sockets remain, remove user entry
          if (socketSet.size === 0) {
            this.usersSockets.delete(userId);
          }

          break; // Exit loop early
        }
      }
    } catch (error) {
      this.logger.error(`🔥 Error in disconnect handling: ${error.message}`);
    }
  }

  sendEventToUser(userId: string, eventType: EventType, payload: any) {
    const socketIds = this.usersSockets.get(userId);

    if (!socketIds || socketIds.size === 0) {
      this.logger.warn(
        `⚠️  No active sessions for user ${userId}, skipping notification.`,
      );
      return;
    }

    if (socketIds) {
      this.server.to([...socketIds]).emit(eventType, payload);
    }
  }

  @SubscribeMessage(EventType.MESSAGE)
  handleMessage(@MessageBody() messageData: any) {
    // Example structure: { senderId, receiverId, message }
    this.sendEventToUser(
      messageData.receiverId,
      EventType.MESSAGE,
      messageData,
    );
  }
}
