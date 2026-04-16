// Questionnaire Controller
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { SubmitQuestionnaireDto } from './dto/questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('questionnaire')
@UseGuards(JwtAuthGuard)
export class QuestionnaireController {
    constructor(private questionnaireService: QuestionnaireService) { }

    /**
     * Get all active questions
     * GET /api/questionnaire/questions
     */
    @Get('questions')
    async getQuestions() {
        return this.questionnaireService.getQuestions();
    }

    /**
     * Submit questionnaire responses
     * POST /api/questionnaire/submit
     */
    @Post('submit')
    async submitQuestionnaire(
        @CurrentUser() user: any,
        @Body() submitDto: SubmitQuestionnaireDto,
    ) {
        return this.questionnaireService.submitQuestionnaire(user.userId, submitDto);
    }

    /**
     * Get user's questionnaire logs
     * GET /api/questionnaire/logs
     */
    @Get('logs')
    async getUserLogs(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ) {
        return this.questionnaireService.getUserLogs(user.userId, limit || 30);
    }

    /**
     * Get user's questionnaire statistics
     * GET /api/questionnaire/stats
     */
    @Get('stats')
    async getUserStats(@CurrentUser() user: any) {
        return this.questionnaireService.getUserStats(user.userId);
    }
}
