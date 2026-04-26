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
    const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];
    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            const isVercel = origin.endsWith('.vercel.app');
            const isAllowed = allowedOrigins.includes(origin) || isVercel;
            
            if (isAllowed) {
                callback(null, true);
            } else {
                // In development, log the blocked origin to help troubleshooting
                console.warn(`CORS blocked request from: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
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
