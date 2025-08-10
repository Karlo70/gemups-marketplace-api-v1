import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/modules/users/entities/user.entity";

export const ROLES_KEY = "rolesDecorator";
export const RolesDecorator = (...roles: UserRole[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
