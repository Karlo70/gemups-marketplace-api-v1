import { DataSource } from 'typeorm';
import { Product, ProxiesProvider, ProductStatus } from '../src/modules/products/entities/product.entity';
import { Category } from '../src/modules/category/entities/category.entity';

export const createProducts = async (dataSource: DataSource) => {
  const productRepository = dataSource.getRepository(Product);
  const categoryRepository = dataSource.getRepository(Category);

  // Get categories first
  const categories = await categoryRepository.find();
  if (categories.length === 0) {
    console.log('No categories found. Please run categories seed first.');
    return;
  }

  const products = [
    {
      name: 'Residential Proxy Package',
      description: 'High-quality residential proxies for web scraping and automation',
      price_per_ip: 0.15,
      provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
      status: ProductStatus.ACTIVE,
      category: categories.find(c => c.name === 'Residential Proxies'),
    },
    {
      name: 'Datacenter Proxy Package',
      description: 'Fast and reliable datacenter proxies for high-speed operations',
      price_per_ip: 0.08,
      provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
      status: ProductStatus.ACTIVE,
      category: categories.find(c => c.name === 'Datacenter Proxies'),
    },
    {
      name: 'Mobile Proxy Package',
      description: 'Mobile proxies for mobile-specific applications and testing',
      price_per_ip: 0.25,
      provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
      status: ProductStatus.ACTIVE,
      category: categories.find(c => c.name === 'Mobile Proxies'),
    },
    {
      name: 'Rotating Proxy Package',
      description: 'Automatically rotating proxies for enhanced anonymity',
      price_per_ip: 0.20,
      provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
      status: ProductStatus.ACTIVE,
      category: categories.find(c => c.name === 'Rotating Proxies'),
    },
    {
      name: 'Static Proxy Package',
      description: 'Dedicated static proxies for consistent performance',
      price_per_ip: 0.30,
      provider: ProxiesProvider.SEVEN_ELEVEN_PROXIES,
      status: ProductStatus.ACTIVE,
      category: categories.find(c => c.name === 'Static Proxies'),
    },
  ];

  for (const productData of products) {
    const existingProduct = await productRepository.findOne({
      where: { 
        name: productData.name,
        provider: productData.provider 
      },
    });

    if (!existingProduct) {
      const product = productRepository.create(productData);
      await product.save();
      console.log(`Created product: ${product.name}`);
    } else {
      console.log(`Product already exists: ${productData.name}`);
    }
  }

  console.log('Products seeding completed');
};
