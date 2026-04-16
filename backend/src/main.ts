// Main Application Entry Point
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { validationPipeConfig } from './common/pipes/validation.pipe';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Increase body size limit to handle base64 image uploads (default is 100kb — too small)
    app.use(require('express').json({ limit: '10mb' }));
    app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

    // Enable CORS for frontend communication
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Apply global validation pipe
    app.useGlobalPipes(validationPipeConfig);

    // Apply global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Set global prefix for all routes
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 StressAway Backend is running on: http://localhost:${port}/api`);
    // console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
