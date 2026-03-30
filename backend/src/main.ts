import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔧 [Bootstrap] Starting Deka Backend initialization...');
  
  try {
    console.log('📦 [Bootstrap] Creating NestJS application...');
    const app = await NestFactory.create(AppModule);
    console.log('✅ [Bootstrap] NestJS application created successfully');

    console.log('🔐 [Bootstrap] Setting up global validation pipe...');
    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    console.log('✅ [Bootstrap] Validation pipe configured');

    console.log('🌐 [Bootstrap] Configuring CORS...');
    // CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    console.log('✅ [Bootstrap] CORS configured - allowed origins:', process.env.CORS_ORIGIN || 'http://localhost:3000');

    const port = process.env.API_PORT || 3000;
    console.log(`🚀 [Bootstrap] Starting to listen on port ${port}...`);
    await app.listen(port);
    console.log(`✅ 🚀 Deka Backend running on http://0.0.0.0:${port}`);
  } catch (error) {
    console.error('❌ [Bootstrap] FATAL ERROR during initialization:');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
