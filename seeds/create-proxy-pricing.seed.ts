import { DataSource } from 'typeorm';
import { ProxyPricingSetting, ProxyType, FlowUnit } from 'src/modules/setting/entities/setting.entity';

export const createProxyPricingSeed = async (dataSource: DataSource) => {
  const proxyPricingRepository = dataSource.getRepository(ProxyPricingSetting);

  // Check if pricing settings already exist
  const existingPricing = await proxyPricingRepository.count();
  if (existingPricing > 0) {
    console.log('Proxy pricing settings already exist, skipping seed...');
    return;
  }

  const pricingSettings = [
    {
      proxy_type: ProxyType.RESIDENTIAL,
      price_per_ip: 0.75,
      price_per_flow: 0.15,
      flow_unit: FlowUnit.GB,
      flow_multiplier: 1,
      setup_fee: 10.00,
      maintenance_fee: 5.00,
      minimum_quantity: 1,
      maximum_quantity: 1000,
      discount_percentage: 20,
      discount_threshold: 100,
      is_active: true,
      notes: 'High-quality residential proxies with premium pricing',
      custom_pricing_rules: {
        bulk_discounts: [
          { threshold: 500, discount: 25 },
          { threshold: 1000, discount: 30 }
        ]
      }
    },
    {
      proxy_type: ProxyType.DATACENTER,
      price_per_ip: 0.25,
      price_per_flow: 0.08,
      flow_unit: FlowUnit.GB,
      flow_multiplier: 1,
      setup_fee: 5.00,
      maintenance_fee: 2.00,
      minimum_quantity: 10,
      maximum_quantity: 5000,
      discount_percentage: 15,
      discount_threshold: 200,
      is_active: true,
      notes: 'Cost-effective datacenter proxies for high-volume usage',
      custom_pricing_rules: {
        volume_tiers: [
          { min_quantity: 1000, price_per_ip: 0.20 },
          { min_quantity: 2000, price_per_ip: 0.18 }
        ]
      }
    },
    {
      proxy_type: ProxyType.MOBILE,
      price_per_ip: 1.20,
      price_per_flow: 0.25,
      flow_unit: FlowUnit.GB,
      flow_multiplier: 1,
      setup_fee: 15.00,
      maintenance_fee: 8.00,
      minimum_quantity: 1,
      maximum_quantity: 500,
      discount_percentage: 10,
      discount_threshold: 50,
      is_active: true,
      notes: 'Premium mobile proxies with high success rates',
      custom_pricing_rules: {
        mobile_carriers: {
          'verizon': { multiplier: 1.1 },
          'att': { multiplier: 1.05 },
          'tmobile': { multiplier: 1.0 }
        }
      }
    },
    {
      proxy_type: ProxyType.ROTATING,
      price_per_ip: 0.40,
      price_per_flow: 0.12,
      flow_unit: FlowUnit.GB,
      flow_multiplier: 1,
      setup_fee: 8.00,
      maintenance_fee: 3.00,
      minimum_quantity: 5,
      maximum_quantity: 2000,
      discount_percentage: 18,
      discount_threshold: 150,
      is_active: true,
      notes: 'Rotating proxies with automatic IP rotation',
      custom_pricing_rules: {
        rotation_frequency: {
          'hourly': { multiplier: 1.0 },
          'daily': { multiplier: 0.9 },
          'weekly': { multiplier: 0.8 }
        }
      }
    }
  ];

  for (const pricingData of pricingSettings) {
    const pricing = proxyPricingRepository.create(pricingData);
    await pricing.save();
  }

  console.log('✅ Proxy pricing settings seeded successfully!');
  console.log(`Created ${pricingSettings.length} pricing configurations`);
};
