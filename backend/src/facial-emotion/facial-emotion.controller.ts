// Facial Emotion Controller
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { FacialEmotionService } from './facial-emotion.service';
import { PredictEmotionDto } from './dto/facial-emotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('facial-emotion')
@UseGuards(JwtAuthGuard)
export class FacialEmotionController {
    constructor(private facialEmotionService: FacialEmotionService) { }

    /**
     * Predict emotion from facial image
     * POST /api/facial-emotion/predict
     */
    @Post('predict')
    async predictEmotion(
        @CurrentUser() user: any,
        @Body() predictDto: PredictEmotionDto,
    ) {
        return this.facialEmotionService.predictEmotion(user.userId, predictDto);
    }

    /**
     * Get user's facial emotion logs
     * GET /api/facial-emotion/logs
     */
    @Get('logs')
    async getUserLogs(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ) {
        return this.facialEmotionService.getUserLogs(user.userId, limit || 30);
    }

    /**
     * Get user's facial emotion statistics
     * GET /api/facial-emotion/stats
     */
    @Get('stats')
    async getUserStats(@CurrentUser() user: any) {
        return this.facialEmotionService.getUserStats(user.userId);
    }
}
