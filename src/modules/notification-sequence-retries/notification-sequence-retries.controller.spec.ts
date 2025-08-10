import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSequenceRetriesController } from './notification-sequence-retries.controller';
import { NotificationSequenceRetriesService } from './notification-sequence-retries.service';
import { CreateNotificationSequenceRetryDto } from './dto/create-notification-sequence-retry.dto';
import { UpdateNotificationSequenceRetryDto } from './dto/update-notification-sequence-retry.dto';
import { NotificationSequenceRetriesStatus } from './entities/notification-sequence-retry.entity';

describe('NotificationSequenceRetriesController', () => {
  let controller: NotificationSequenceRetriesController;
  let service: NotificationSequenceRetriesService;

  const mockNotificationSequenceRetriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findBySequenceId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationSequenceRetriesController],
      providers: [
        {
          provide: NotificationSequenceRetriesService,
          useValue: mockNotificationSequenceRetriesService,
        },
      ],
    }).compile();

    controller = module.get<NotificationSequenceRetriesController>(NotificationSequenceRetriesController);
    service = module.get<NotificationSequenceRetriesService>(NotificationSequenceRetriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification sequence retry', async () => {
      const createDto: CreateNotificationSequenceRetryDto = {
        sequence_id: 'test-sequence-id',
        retry_order: 1,
        retry_delay_minutes: 30,
        status: NotificationSequenceRetriesStatus.ACTIVE,
      };

      const expectedResult = { id: 'test-retry-id', ...createDto };
      mockNotificationSequenceRetriesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all notification sequence retries', async () => {
      const expectedResult = [
        { id: 'retry-1', retry_order: 1 },
        { id: 'retry-2', retry_order: 2 },
      ];

      mockNotificationSequenceRetriesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findBySequenceId', () => {
    it('should return retries by sequence id', async () => {
      const sequenceId = 'test-sequence-id';
      const expectedResult = [
        { id: 'retry-1', retry_order: 1 },
        { id: 'retry-2', retry_order: 2 },
      ];

      mockNotificationSequenceRetriesService.findBySequenceId.mockResolvedValue(expectedResult);

      const result = await controller.findBySequenceId(sequenceId);

      expect(result).toEqual(expectedResult);
      expect(service.findBySequenceId).toHaveBeenCalledWith(sequenceId);
    });
  });

  describe('findOne', () => {
    it('should return a notification sequence retry by id', async () => {
      const id = 'test-retry-id';
      const expectedResult = { id, retry_order: 1 };

      mockNotificationSequenceRetriesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a notification sequence retry', async () => {
      const id = 'test-retry-id';
      const updateDto: UpdateNotificationSequenceRetryDto = {
        retry_delay_minutes: 60,
        status: NotificationSequenceRetriesStatus.ACTIVE,
      };

      const expectedResult = { id, retry_order: 1, retry_delay_minutes: 60, status: NotificationSequenceRetriesStatus.ACTIVE };
      mockNotificationSequenceRetriesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a notification sequence retry', async () => {
      const id = 'test-retry-id';
      const expectedResult = { message: 'Notification sequence retry deleted successfully' };

      mockNotificationSequenceRetriesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
