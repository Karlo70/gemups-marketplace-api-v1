import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

export function validateUser(
  id: string,
  currentUser: User,
  updateUserDto: UpdateUserDto,
  user: User,
) {
  if ([UserRole.ADMIN].includes(currentUser?.role)) {
    if (user?.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "You are not allowed to update super admin's information",
      );
    }

    if (user?.role === UserRole.ADMIN && user?.id !== currentUser?.id) {
      throw new ForbiddenException(
        "You are not allowed to update another admin's information",
      );
    }
  }

  if (
    updateUserDto?.role === UserRole.ADMIN &&
    currentUser?.role !== UserRole.SUPER_ADMIN
  ) {
    throw new ForbiddenException(
      'You are not allowed to update the admin role.',
    );
  }

  if (
    [UserRole.CUSTOMER].includes(currentUser.role) &&
    user.id !== currentUser.id
  ) {
    throw new ForbiddenException(
      "You are not allowed to update another customer's information",
    );
  }

  if (updateUserDto?.role) {
    if (
      [UserRole.CUSTOMER].includes(currentUser.role) &&
      user.role !== updateUserDto?.role
    ) {
      throw new ForbiddenException(
        'You are not allowed to update another role',
      );
    }
  }

  if (
    [UserRole.CUSTOMER].includes(currentUser.role) &&
    updateUserDto?.password
  ) {
    throw new BadRequestException(
      'Please use /users/change-password route to change password',
    );
  }
}
