import { SetMetadata } from '@nestjs/common';

type UserRoleType = 'SUPPLIER' | 'RESELLER' | 'DELIVERY' | 'ADMIN';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleType[]) =>
  SetMetadata(ROLES_KEY, roles);
