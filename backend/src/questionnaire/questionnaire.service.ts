// Questionnaire Service
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { SosService } from '../sos/sos.service';
import { SubmitQuestionnaireDto } from './dto/questionnaire.dto';

@Injectable()
export class QuestionnaireService {
    constructor(
        private supabaseService: SupabaseService,
        private sosService: SosService
    ) { }

    /**
     * Get all active questionnaire questions
     */
    async getQuestions() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questionnaire_questions')
            .select('*')
            .eq('is_active', true)
            .order('question_order', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Submit questionnaire and calculate stress score
     */
    async submitQuestionnaire(userId: string, submitDto: SubmitQuestionnaireDto) {
        const { responses, notes } = submitDto;

        // Get all questions with weights
        const questions = await this.getQuestions();
        const questionMap = new Map(questions.map(q => [q.id, q]));

        // Calculate weighted stress score
        let totalWeightedScore = 0;
        let totalMaxWeightedScore = 0;
        const responsesObj = {};

        for (const response of responses) {
            const question = questionMap.get(response.question_id);
            if (!question) continue;

            const weight = question.weight || 1.0;
            const maxValue = question.max_value || 5;

            // Store response
            responsesObj[response.question_id] = response.answer_value;

            // Calculate weighted scores
            totalWeightedScore += response.answer_value * weight;
            totalMaxWeightedScore += maxValue * weight;
        }

        // Calculate final stress score (0-100 scale)
        const stressScore = (totalWeightedScore / totalMaxWeightedScore) * 100;

        // Save to database
        const logData = {
            user_id: userId,
            stress_score: stressScore.toFixed(2),
            responses: responsesObj,
            notes: notes || null,
        };

        const result = await this.supabaseService.insert('questionnaire_stress_logs', logData);

        // Automatic SOS if stress > 70
        let sosTriggered = false;
        if (stressScore > 70) {
            await this.sosService.triggerSos(userId, {
                trigger_reason: `High stress detected via questionnaire (${stressScore.toFixed(0)}%)`,
                stress_level: stressScore,
                message: `Contact them their stress score was ${stressScore.toFixed(0)}% in recent record`
            } as any);
            sosTriggered = true;
        }

        return {
            stress_score: parseFloat(stressScore.toFixed(2)),
            log_id: result[0].id,
            created_at: result[0].created_at,
            sos_triggered: sosTriggered
        };
    }

    /**
     * Get user's questionnaire history
     */
    async getUserLogs(userId: string, limit: number = 30) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questionnaire_stress_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Get statistical summary for user
     */
    async getUserStats(userId: string) {
        const logs = await this.getUserLogs(userId, 100);

        if (logs.length === 0) {
            return {
                total_assessments: 0,
                average_stress: 0,
                min_stress: 0,
                max_stress: 0,
                recent_trend: 'no_data',
            };
        }

        const scores = logs.map(log => parseFloat(log.stress_score));
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const min = Math.min(...scores);
        const max = Math.max(...scores);

        // Calculate trend (last 5 vs previous 5)
        let trend = 'stable';
        if (logs.length >= 10) {
            const recent5 = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
            const previous5 = scores.slice(5, 10).reduce((a, b) => a + b, 0) / 5;

            if (recent5 > previous5 + 5) trend = 'increasing';
            else if (recent5 < previous5 - 5) trend = 'decreasing';
        }

        return {
            total_assessments: logs.length,
            average_stress: parseFloat(average.toFixed(2)),
            min_stress: parseFloat(min.toFixed(2)),
            max_stress: parseFloat(max.toFixed(2)),
            recent_trend: trend,
        };
    }
}
