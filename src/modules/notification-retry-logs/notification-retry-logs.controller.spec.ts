import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRetryLogsController } from './notification-retry-logs.controller';
import { NotificationRetryLogsService } from './notification-retry-logs.service';
import { CreateNotificationRetryLogDto } from './dto/create-notification-retry-log.dto';
import { UpdateNotificationRetryLogDto } from './dto/update-notification-retry-log.dto';

describe('NotificationRetryLogsController', () => {
  let controller: NotificationRetryLogsController;
  let service: NotificationRetryLogsService;

  const mockNotificationRetryLogsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByPendingNotificationId: jest.fn(),
    findSuccessfulAttempts: jest.fn(),
    findFailedAttempts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationRetryLogsController],
      providers: [
        {
          provide: NotificationRetryLogsService,
          useValue: mockNotificationRetryLogsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationRetryLogsController>(NotificationRetryLogsController);
    service = module.get<NotificationRetryLogsService>(NotificationRetryLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification retry log', async () => {
      const createDto: CreateNotificationRetryLogDto = {
        pending_notification_id: 'test-pending-id',
        attempt_number: 1,
        attempted_at: new Date(),
        success: true,
      };

      const expectedResult = { id: 'test-log-id', ...createDto };
      mockNotificationRetryLogsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all notification retry logs', async () => {
      const expectedResult = [
        { id: 'log-1', attempt_number: 1 },
        { id: 'log-2', attempt_number: 2 },
      ];

      mockNotificationRetryLogsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByPendingNotificationId', () => {
    it('should return retry logs by pending notification id', async () => {
      const pendingNotificationId = 'test-pending-id';
      const expectedResult = [
        { id: 'log-1', attempt_number: 1 },
        { id: 'log-2', attempt_number: 2 },
      ];

      mockNotificationRetryLogsService.findByPendingNotificationId.mockResolvedValue(expectedResult);

      const result = await controller.findByPendingNotificationId(pendingNotificationId);

      expect(result).toEqual(expectedResult);
      expect(service.findByPendingNotificationId).toHaveBeenCalledWith(pendingNotificationId);
    });
  });

  describe('findSuccessfulAttempts', () => {
    it('should return successful attempts by pending notification id', async () => {
      const pendingNotificationId = 'test-pending-id';
      const expectedResult = [
        { id: 'log-1', attempt_number: 1, success: true },
      ];

      mockNotificationRetryLogsService.findSuccessfulAttempts.mockResolvedValue(expectedResult);

      const result = await controller.findSuccessfulAttempts(pendingNotificationId);

      expect(result).toEqual(expectedResult);
      expect(service.findSuccessfulAttempts).toHaveBeenCalledWith(pendingNotificationId);
    });
  });

  describe('findFailedAttempts', () => {
    it('should return failed attempts by pending notification id', async () => {
      const pendingNotificationId = 'test-pending-id';
      const expectedResult = [
        { id: 'log-2', attempt_number: 2, success: false },
      ];

      mockNotificationRetryLogsService.findFailedAttempts.mockResolvedValue(expectedResult);

      const result = await controller.findFailedAttempts(pendingNotificationId);

      expect(result).toEqual(expectedResult);
      expect(service.findFailedAttempts).toHaveBeenCalledWith(pendingNotificationId);
    });
  });

  describe('findOne', () => {
    it('should return a notification retry log by id', async () => {
      const id = 'test-log-id';
      const expectedResult = { id, attempt_number: 1 };

      mockNotificationRetryLogsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a notification retry log', async () => {
      const id = 'test-log-id';
      const updateDto: UpdateNotificationRetryLogDto = {
        success: false,
        error: 'Connection timeout',
      };

      const expectedResult = { id, attempt_number: 1, success: false, error: 'Connection timeout' };
      mockNotificationRetryLogsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a notification retry log', async () => {
      const id = 'test-log-id';
      const expectedResult = { message: 'Notification retry log deleted successfully' };

      mockNotificationRetryLogsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
