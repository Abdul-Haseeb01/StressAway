import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { SosService } from '../sos/sos.service';
import { PredictEmotionDto, EmotionProbabilities } from './dto/facial-emotion.dto';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FacialEmotionService {
    constructor(
        private supabaseService: SupabaseService,
        private sosService: SosService
    ) { }

    /**
     * Predict emotion from image by sending to Python ML model
     */
    async predictEmotion(userId: string, predictDto: PredictEmotionDto) {
        if (!predictDto.image_base64) {
            throw new BadRequestException('No image provided for facial scan');
        }

        // Clean base64 string
        const base64Data = predictDto.image_base64.replace(/^data:image\/\w+;base64,/, '');
        
        // Generate a temporary file name to save the picture safely
        const tempFileName = `temp_capture_${crypto.randomBytes(8).toString('hex')}.jpg`;
        // Since both backend and frontend execution environments launch from their respective project folders, process.cwd() ensures safety
        const tempFilePath = path.join(process.cwd(), '..', tempFileName);

        fs.writeFileSync(tempFilePath, base64Data, 'base64');

        let emotionProbabilities: EmotionProbabilities;
        let dominantEmotion: string;
        let stressScore: number;
        let confidence: number;

        try {
            // ML directory uses completely robust process.cwd climbing
            const mlModelPath = path.join(process.cwd(), '..', 'ml-model');
            const inferenceScript = path.join(mlModelPath, 'inference.py');

            // Call the python script synchronously with --json
            // IMPORTANT: set cwd to mlModelPath so Python script finds its local 'models/...' relative paths
            // Use the specific python installation where we installed dependencies
            const pythonPath = 'C:\\Users\\LENOVO\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
            const outputBuffer = execSync(`"${pythonPath}" "${inferenceScript}" --image "${tempFilePath}" --json`, {
                cwd: mlModelPath
            });
            let outputString = outputBuffer.toString().trim();
            
            // Safeguard against TensorFlow/Python logging noise polluting stdout: extract only the JSON object
            const jsonStart = outputString.indexOf('{');
            const jsonEnd = outputString.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
                outputString = outputString.substring(jsonStart, jsonEnd + 1);
            }
            
            const result = JSON.parse(outputString);

            if (result.error) {
                // Delete temp file
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                return {
                    success: false,
                    message: result.error,
                    image_base64: result.boxed_image_base64
                };
            }

            dominantEmotion = result.predicted_emotion;
            confidence = result.confidence * 100;
            stressScore = result.stress_score;
            emotionProbabilities = result.probabilities as EmotionProbabilities;
            
            // Delete the temp file now that we have the boxed result natively inside `result.boxed_image_base64`
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }

            // Record stress check in database
            const logData = {
                user_id: userId,
                stress_score: stressScore.toFixed(2),
                detected_emotion: dominantEmotion,
                emotion_probabilities: emotionProbabilities,
                confidence: confidence.toFixed(2),
            };
            const dbResult = await this.supabaseService.insert('facial_stress_logs', logData);

            // Automatic SOS if stress > 70
            let sosTriggered = false;
            if (stressScore > 70) {
                await this.sosService.triggerSos(userId, {
                    trigger_reason: `High stress detected via facial scan (${stressScore.toFixed(0)}%)`,
                    stress_level: stressScore,
                    message: `Contact them their stress score was ${stressScore.toFixed(0)}% in recent record`
                } as any);
                sosTriggered = true;
            }

            return {
                success: true,
                message: 'Facial scan processed successfully',
                detected_emotion: dominantEmotion,
                confidence: confidence,
                stress_score: stressScore,
                probabilities: emotionProbabilities,
                image_base64: result.boxed_image_base64,
                sos_triggered: sosTriggered
            };
            
        } catch (err: any) {
            // Delete the image (privacy)
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            console.error('Python ML execution failed:', err);
            
            // If the error was explicitly thrown by us (BadRequestException), bubble it immediately to frontend
            if (err instanceof BadRequestException || err.status === 400) {
                throw err;
            }

            // Return a clear error so user doesn't get "random" results
            return {
                success: false,
                message: 'Facial analysis service is currently initializing or unavailable. Please try again in a moment.',
                error_detail: err.message
            };
        }
    }

    /**
     * Get user's facial emotion logs
     */
    async getUserLogs(userId: string, limit: number = 30) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('facial_stress_logs')
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
                total_scans: 0,
                average_stress: 0,
                most_common_emotion: 'none',
                emotion_distribution: {},
            };
        }

        const scores = logs.map(log => parseFloat(log.stress_score));
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;

        // Calculate emotion distribution
        const emotionCounts = {};
        logs.forEach(log => {
            const emotion = log.detected_emotion;
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) =>
            emotionCounts[a] > emotionCounts[b] ? a : b
        );

        return {
            total_scans: logs.length,
            average_stress: parseFloat(average.toFixed(2)),
            most_common_emotion: mostCommonEmotion,
            emotion_distribution: emotionCounts,
        };
    }
}
