import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationRetryLogsService } from './notification-retry-logs.service';
import { NotificationRetryLog } from './entities/notification-retry-log.entity';
import { PendingNotification } from '../pending-notifications/entities/pending-notifications.entity';
import { CreateNotificationRetryLogDto } from './dto/create-notification-retry-log.dto';
import { UpdateNotificationRetryLogDto } from './dto/update-notification-retry-log.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('NotificationRetryLogsService', () => {
  let service: NotificationRetryLogsService;
  let notificationRetryLogRepository: Repository<NotificationRetryLog>;
  let pendingNotificationRepository: Repository<PendingNotification>;

  const mockNotificationRetryLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockPendingNotificationRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRetryLogsService,
        {
          provide: getRepositoryToken(NotificationRetryLog),
          useValue: mockNotificationRetryLogRepository,
        },
        {
          provide: getRepositoryToken(PendingNotification),
          useValue: mockPendingNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationRetryLogsService>(NotificationRetryLogsService);
    notificationRetryLogRepository = module.get<Repository<NotificationRetryLog>>(
      getRepositoryToken(NotificationRetryLog),
    );
    pendingNotificationRepository = module.get<Repository<PendingNotification>>(
      getRepositoryToken(PendingNotification),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification retry log', async () => {
      const createDto: CreateNotificationRetryLogDto = {
        pending_notification_id: 'test-pending-id',
        attempt_number: 1,
        attempted_at: new Date(),
        success: true,
      };

      const mockPendingNotification = { id: 'test-pending-id' };
      const mockRetryLog = { id: 'test-log-id', ...createDto };

      mockPendingNotificationRepository.findOne.mockResolvedValue(mockPendingNotification);
      mockNotificationRetryLogRepository.findOne.mockResolvedValue(null);
      mockNotificationRetryLogRepository.create.mockReturnValue(mockRetryLog);
      mockNotificationRetryLogRepository.save.mockResolvedValue(mockRetryLog);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRetryLog);
      expect(mockPendingNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.pending_notification_id },
      });
    });

    it('should throw NotFoundException when pending notification not found', async () => {
      const createDto: CreateNotificationRetryLogDto = {
        pending_notification_id: 'non-existent-id',
        attempt_number: 1,
        attempted_at: new Date(),
        success: true,
      };

      mockPendingNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all notification retry logs', async () => {
      const mockRetryLogs = [
        { id: 'log-1', attempt_number: 1 },
        { id: 'log-2', attempt_number: 2 },
      ];

      mockNotificationRetryLogRepository.find.mockResolvedValue(mockRetryLogs);

      const result = await service.findAll();

      expect(result).toEqual(mockRetryLogs);
      expect(mockNotificationRetryLogRepository.find).toHaveBeenCalledWith({
        relations: {
          pending_notification: true
        },
        order: {
          attempted_at: 'DESC'
        }
      });
    });
  });

  describe('findOne', () => {
    it('should return a notification retry log by id', async () => {
      const mockRetryLog = { id: 'test-log-id', attempt_number: 1 };

      mockNotificationRetryLogRepository.findOne.mockResolvedValue(mockRetryLog);

      const result = await service.findOne('test-log-id');

      expect(result).toEqual(mockRetryLog);
      expect(mockNotificationRetryLogRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-log-id' },
        relations: {
          pending_notification: true
        }
      });
    });

    it('should throw NotFoundException when retry log not found', async () => {
      mockNotificationRetryLogRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPendingNotificationId', () => {
    it('should return retry logs by pending notification id', async () => {
      const pendingNotificationId = 'test-pending-id';
      const mockRetryLogs = [
        { id: 'log-1', attempt_number: 1 },
        { id: 'log-2', attempt_number: 2 },
      ];

      mockNotificationRetryLogRepository.find.mockResolvedValue(mockRetryLogs);

      const result = await service.findByPendingNotificationId(pendingNotificationId);

      expect(result).toEqual(mockRetryLogs);
      expect(mockNotificationRetryLogRepository.find).toHaveBeenCalledWith({
        where: { pending_notification: { id: pendingNotificationId } },
        relations: {
          pending_notification: true
        },
        order: {
          attempt_number: 'ASC'
        }
      });
    });
  });
});
