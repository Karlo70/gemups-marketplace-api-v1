import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { GetAllUserDto } from './dto/get-all-user-dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { ManageStatusDto } from './dto/manage-status-dto';
import { AddDeviceTokenDto } from './dto/add-device-token.dto';
import { LoginAttempt } from '../auth/entities/login-attempt.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ValidationException } from 'src/utils/validation-exception-formatter';
import { ChangePasswordDto } from './dto/change-password.dto';
import { validateUser } from './validation/user-validation';
import { validateOneUser } from './validation/user-get-one.validation';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateTimeZoneDto } from './dto/update-time-zone.dto';
import { UploadProfileDto } from './dto/upload-profile.dto';
import { MediaService } from '../media/media.service';
import { UserS3Paths } from './enums/user-s3.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,


    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,

    private readonly notificationsService: NotificationsService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: User) {
    const isEmailExist = await this.usersRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (isEmailExist)
      throw new ValidationException({ email: 'Email is already exist' });

    if (
      createUserDto?.role === UserRole.ADMIN &&
      currentUser.role != UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(`you cant't create another admin`);
    }

    const user = this.usersRepository.create({
      ...createUserDto,
    });

    await user.save();

    await this.notificationsService.createUserNotificationSetting(user);

    const { password, ...userData } = user;
    return userData;
  }

  async uploadProfile(uploadProfileDto: UploadProfileDto, currentUser: User) {
    if (
      [UserRole.CUSTOMER].includes(
        currentUser.role,
      ) &&
      currentUser.id !== uploadProfileDto.user_id
    ) {
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: uploadProfileDto.user_id,
      },
      relations: {
        profile_image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      file: uploadProfileDto.profile_image,
      folder_path: UserS3Paths.PROFILE_IMAGE,
    };

    const media = await this.mediaService.createMedia(user, payload);

    if (user.profile_image) {
      await this.mediaService.deleteMedia(user, { id: user.profile_image.id });
    }

    user.profile_image = media;

    return user.save();
  }

  async changePassword(
    currentUser: User,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: currentUser.id },
      select: ['password', 'id', 'role'],
    });

    if (!user) throw new NotFoundException('User not found');

    if (!(await user.comparePassword(changePasswordDto.password))) {
      throw new ValidationException({ password: 'Invalid password' });
    }

    if (changePasswordDto.password === changePasswordDto.new_password) {
      throw new ValidationException({
        new_password: 'Old password & new password cannot be same.',
      });
    }

    user.password = changePasswordDto.new_password;

    await user.save();
  }

  async findAll(currentUser: User, getAllDto: GetAllUserDto) {
    const { page, per_page, search, status, role, end_date, start_date } =
      getAllDto;

    const query = this.usersRepository
      .createQueryBuilder('users')
      .where('users.role != :excludeSuperAdmin AND users.deleted_at IS NULL', {
        excludeSuperAdmin: UserRole.SUPER_ADMIN,
      })
      .orderBy('created_at', 'DESC');

    if (currentUser?.role === UserRole.ADMIN) {
      query.andWhere('users.role != :excludeAdmin', {
        excludeAdmin: UserRole.ADMIN,
      });
    }

    if (role) {
      query.andWhere('users.role = :role', { role: role });
    }

    if (search) {
      query.andWhere(
        `(users.first_name || ' '  || users.last_name ILIKE :search OR users.email ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('users.status = :status', { status });
    }

    if (start_date) {
      query.andWhere('users.created_at >= :start_date', { start_date });
    }

    if (end_date) {
      query.andWhere('users.created_at <= :end_date', { end_date });
    }

    const paginationOptions: IPaginationOptions = {
      page: page ?? 1,
      limit: per_page ?? 10,
    };

    return await paginate<User>(query, paginationOptions);
  }

  async findOne({ id }: ParamIdDto, currentUser: User) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
      relations: {
        profile_image: true,
      },
    });

    if (!user) throw new NotFoundException('Organization not found');

    validateOneUser(currentUser, user);

    return user;
  }

  async update(
    { id }: ParamIdDto,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });

    if (!user) throw new NotFoundException('User not found');

    validateUser(id, currentUser, updateUserDto, user);

    if (updateUserDto?.email) {
      const user = await this.usersRepository.findOne({
        where: {
          email: updateUserDto.email,
          id: Not(id),
        },
      });

      if (user) throw new NotFoundException('this email already exist');
    }

    Object.assign(user, updateUserDto);

    return user.save();
  }

  async updateTimeZone(
    currentUser: User,
    updateTimeZoneDto: UpdateTimeZoneDto,
  ) {
    const user = await this.usersRepository.findOne({
      where: {
        id: currentUser.id,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, updateTimeZoneDto);
    return await user.save();
  }

  async manageStatus(
    { id }: ParamIdDto,
    manageStatusDto: ManageStatusDto,
    currentUser: User,
  ) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user?.role === UserRole.ADMIN && currentUser?.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        "You are not allowed to update other admin's status",
      );
    }

    if (user?.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "You are not allowed to update super admin's status",
      );
    }

    Object.assign(user, manageStatusDto);

    return user.save();
  }

  async remove(currentUser: User) {
    const user = await this.usersRepository.findOne({
      where: {
        id: currentUser.id,
        deleted_at: IsNull(),
      },
    });

    if (user?.role === UserRole.SUPER_ADMIN)
      throw new BadRequestException(
        `A Super Admin cannot delete their own account.`,
      );

    if (!user) throw new NotFoundException('User not found');

    user.deleted_at = new Date();
    await user.save();
  }

  async addDeviceToken(
    currentLoginAttempt: LoginAttempt,
    addDeviceTokenDto: AddDeviceTokenDto,
  ) {
    currentLoginAttempt.fcm_device_token = addDeviceTokenDto.device_token;
    await this.loginAttemptRepository.save(currentLoginAttempt);
  }


  async userCounts(currentUser: User) {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .select([
        // Total
        `SUM(CASE WHEN user.status = :active THEN 1 ELSE 0 END) as total_active`,
        `SUM(CASE WHEN user.status = :inactive THEN 1 ELSE 0 END) as total_inactive`,

        // Customer
        `SUM(CASE WHEN user.role = :customer AND user.status = :active THEN 1 ELSE 0 END) as customer_active`,
        `SUM(CASE WHEN user.role = :customer AND user.status = :inactive THEN 1 ELSE 0 END) as customer_inactive`,

        // Admin (only shown if current user is super_admin)
        ...(currentUser.role === UserRole.SUPER_ADMIN ? [
          `SUM(CASE WHEN user.role = :admin AND user.status = :active THEN 1 ELSE 0 END) as admin_active`,
          `SUM(CASE WHEN user.role = :admin AND user.status = :inactive THEN 1 ELSE 0 END) as admin_inactive`
        ] : []),
      ])
      .setParameters({
        active: UserStatus.ACTIVE,
        inactive: UserStatus.INACTIVE,
        admin: UserRole.ADMIN,
        customer: UserRole.CUSTOMER,
      });

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
        query.andWhere('user.role != :admin', { admin: UserRole.ADMIN });
    }

    const result = await query.getRawOne();

    const response: any = {
      total: {
        active: Number(result.total_active ?? 0),
        inactive: Number(result.total_inactive ?? 0),
      },
      ...(currentUser.role === UserRole.SUPER_ADMIN && {
        customer: {
          active: Number(result.customer_active ?? 0),
          inactive: Number(result.customer_inactive ?? 0),
        },
      }),
    };

    return response;
  }
}
