import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@laundry.com' },
    update: {},
    create: {
      name: 'Admin Laundry',
      email: 'admin@laundry.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '081234567890',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create demo customer
  const customerPasswordHash = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'pelanggan@example.com' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'pelanggan@example.com',
      passwordHash: customerPasswordHash,
      role: 'PELANGGAN',
      phone: '082345678901',
      address: 'Jl. Melati No. 10, Jakarta Selatan',
    },
  });
  console.log(`✅ Customer created: ${customer.email}`);

  // Create laundry services
  const services = [
    { name: 'Cuci Reguler', pricePerKg: 5000 },
    { name: 'Cuci + Setrika', pricePerKg: 8000 },
    { name: 'Setrika Saja', pricePerKg: 4000 },
    { name: 'Cuci Kilat (Express)', pricePerKg: 12000 },
    { name: 'Dry Clean', pricePerKg: 15000 },
  ];

  for (const service of services) {
    const created = await prisma.laundryService.upsert({
      where: { name: service.name } as any,
      update: { pricePerKg: service.pricePerKg },
      create: service,
    });
    console.log(`✅ Service created: ${created.name} - Rp ${created.pricePerKg}/kg`);
  }

  console.log('\n🎉 Seeding completed!');
  console.log('Admin credentials: admin@laundry.com / admin123');
  console.log('Customer credentials: pelanggan@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
