// Questionnaire DTOs
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitQuestionnaireDto {
    @IsArray()
    responses: QuestionResponse[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class QuestionResponse {
    @IsUUID()
    question_id: string;

    @IsNumber()
    answer_value: number;
}
