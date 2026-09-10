import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient({
  log: ['error'],
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Koneksi ke database SUKSES');
    
    const result = await prisma.$queryRaw`SELECT current_user, current_database()`;
    console.log('User:', result[0].current_user);
    console.log('Database:', result[0].current_database);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Koneksi gagal:', error.message);
    process.exit(1);
  }
}

testConnection();
