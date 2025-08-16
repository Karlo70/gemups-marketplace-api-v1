import { DataSource } from 'typeorm';
import { Category, CategoryStatus } from '../src/modules/category/entities/category.entity';

export const createCategories = async (dataSource: DataSource) => {
  const categoryRepository = dataSource.getRepository(Category);

  const categories = [
    {
      name: 'Residential Proxies',
      description: 'High-quality residential proxy services for various use cases',
      image_url: 'https://example.com/images/residential-proxies.jpg',
      status: CategoryStatus.ACTIVE,
    },
    {
      name: 'Datacenter Proxies',
      description: 'Fast and reliable datacenter proxy solutions',
      image_url: 'https://example.com/images/datacenter-proxies.jpg',
      status: CategoryStatus.ACTIVE,
    },
    {
      name: 'Mobile Proxies',
      description: 'Mobile proxy services for mobile-specific applications',
      image_url: 'https://example.com/images/mobile-proxies.jpg',
      status: CategoryStatus.ACTIVE,
    },
    {
      name: 'Rotating Proxies',
      description: 'Automatically rotating proxy services for enhanced anonymity',
      image_url: 'https://example.com/images/rotating-proxies.jpg',
      status: CategoryStatus.ACTIVE,
    },
    {
      name: 'Static Proxies',
      description: 'Dedicated static proxy services for consistent performance',
      image_url: 'https://example.com/images/static-proxies.jpg',
      status: CategoryStatus.ACTIVE,
    },
  ];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      await category.save();
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Category already exists: ${categoryData.name}`);
    }
  }

  console.log('Categories seeding completed');
};
