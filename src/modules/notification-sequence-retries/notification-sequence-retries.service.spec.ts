import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSequenceRetriesService } from './notification-sequence-retries.service';
import { NotificationSequenceRetry } from './entities/notification-sequence-retry.entity';
import { NotificationSequence } from '../notification-sequence/entities/notification-sequence.entity';
import { CreateNotificationSequenceRetryDto } from './dto/create-notification-sequence-retry.dto';
import { UpdateNotificationSequenceRetryDto } from './dto/update-notification-sequence-retry.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('NotificationSequenceRetriesService', () => {
  let service: NotificationSequenceRetriesService;
  let notificationSequenceRetryRepository: Repository<NotificationSequenceRetry>;
  let notificationSequenceRepository: Repository<NotificationSequence>;

  const mockNotificationSequenceRetryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockNotificationSequenceRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSequenceRetriesService,
        {
          provide: getRepositoryToken(NotificationSequenceRetry),
          useValue: mockNotificationSequenceRetryRepository,
        },
        {
          provide: getRepositoryToken(NotificationSequence),
          useValue: mockNotificationSequenceRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationSequenceRetriesService>(NotificationSequenceRetriesService);
    notificationSequenceRetryRepository = module.get<Repository<NotificationSequenceRetry>>(
      getRepositoryToken(NotificationSequenceRetry),
    );
    notificationSequenceRepository = module.get<Repository<NotificationSequence>>(
      getRepositoryToken(NotificationSequence),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification sequence retry', async () => {
      const createDto: CreateNotificationSequenceRetryDto = {
        sequence_id: 'test-sequence-id',
        retry_order: 1,
        gap_minutes: 30,
      };

      const mockSequence = { id: 'test-sequence-id' };
      const mockRetry = { id: 'test-retry-id', ...createDto };

      mockNotificationSequenceRepository.findOne.mockResolvedValue(mockSequence);
      mockNotificationSequenceRetryRepository.findOne.mockResolvedValue(null);
      mockNotificationSequenceRetryRepository.create.mockReturnValue(mockRetry);
      mockNotificationSequenceRetryRepository.save.mockResolvedValue(mockRetry);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRetry);
      expect(mockNotificationSequenceRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.sequence_id },
      });
    });

    it('should throw NotFoundException when sequence not found', async () => {
      const createDto: CreateNotificationSequenceRetryDto = {
        sequence_id: 'non-existent-id',
        retry_order: 1,
        gap_minutes: 30,
      };

      mockNotificationSequenceRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all notification sequence retries', async () => {
      const mockRetries = [
        { id: 'retry-1', retry_order: 1 },
        { id: 'retry-2', retry_order: 2 },
      ];

      mockNotificationSequenceRetryRepository.find.mockResolvedValue(mockRetries);

      const result = await service.findAll();

      expect(result).toEqual(mockRetries);
      expect(mockNotificationSequenceRetryRepository.find).toHaveBeenCalledWith({
        relations: ['sequence'],
        order: { retry_order: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a notification sequence retry by id', async () => {
      const mockRetry = { id: 'test-retry-id', retry_order: 1 };

      mockNotificationSequenceRetryRepository.findOne.mockResolvedValue(mockRetry);

      const result = await service.findOne('test-retry-id');

      expect(result).toEqual(mockRetry);
      expect(mockNotificationSequenceRetryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-retry-id' },
        relations: ['sequence'],
      });
    });

    it('should throw NotFoundException when retry not found', async () => {
      mockNotificationSequenceRetryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
