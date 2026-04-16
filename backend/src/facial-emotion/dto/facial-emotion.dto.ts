// Facial Emotion DTOs
import { IsString, IsObject, IsOptional } from 'class-validator';

export class PredictEmotionDto {
    @IsString()
    image_base64: string; // Base64 encoded image
}

export class EmotionProbabilities {
    angry: number;
    disgust: number;
    fear: number;
    happy: number;
    sad: number;
    surprise: number;
    neutral: number;
}
