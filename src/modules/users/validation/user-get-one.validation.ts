import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User, UserRole, UserStatus } from '../entities/user.entity';

export function validateOneUser(currentUser: User, user: User) {
  if (currentUser?.role === UserRole.ADMIN) {
    if (user?.role === UserRole.ADMIN && user?.id !== currentUser?.id) {
      throw new ForbiddenException(
        "You are not allowed to view another admin's information",
      );
    }
    if (user?.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You are not allowed to view super admin information',
      );
    }
  } else if (
    currentUser.role === UserRole.CUSTOMER &&
    (user.status === UserStatus.INACTIVE ||
      user.deleted_at !== null ||
      [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role))
  ) {
    throw new NotFoundException(`${user.role} not found`);
  }
}
