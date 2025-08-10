import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';

export const createSuperAdmin = async (AppDataSource: DataSource) => {
  const userRepository = AppDataSource.getRepository(User);

  // Check if the super admin already exists to avoid duplicates
  const existingAdmin = await userRepository.findOne({
    where: { email: 'superadmin@example.com' },
  });

  if (existingAdmin) {
    console.log('Super admin already exists');
    return;
  }

  const adminPassword = '123123';
  const superAdmin = userRepository.create({
    first_name: 'Super',
    last_name: 'Admin',
    email: 'superadmin@example.com',
    password: adminPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(superAdmin);

  console.log('Super admin created successfully.');
};
