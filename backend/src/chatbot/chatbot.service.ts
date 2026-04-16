// Chatbot Service - AI-powered mental wellness assistant
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase.service';
import { SendMessageDto } from './dto/chatbot.dto';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

@Injectable()
export class ChatbotService {
    private readonly logger = new Logger(ChatbotService.name);
    private genai: GoogleGenAI | null = null;
    private openai: OpenAI | null = null;

    constructor(
        private supabaseService: SupabaseService,
        private configService: ConfigService
    ) {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

        if (geminiKey) {
            this.genai = new GoogleGenAI({ apiKey: geminiKey });
            this.logger.log('Google GenAI initialized');
        }
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
            this.logger.log('OpenAI initialized');
        }

        if (!geminiKey && !openaiKey) {
            this.logger.warn('No AI keys configured, chatbot will use fallback responses.');
        }
    }

    /**
     * Send message and get chatbot response
     */
    async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
        const { message } = sendMessageDto;

        // Save user message
        await this.saveMessage(userId, message, true);

        // Generate response based on message content
        const response = await this.generateResponse(userId, message.toLowerCase());

        // Save bot response
        await this.saveMessage(userId, response, false);

        return {
            user_message: message,
            bot_response: response,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get chat history for user
     */
    async getChatHistory(userId: string, limit: number = 50) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data.reverse(); // Return in chronological order
    }

    /**
     * Save message to database
     */
    private async saveMessage(userId: string, message: string, isUserMessage: boolean) {
        const messageData = {
            user_id: userId,
            message,
            is_user_message: isUserMessage,
        };

        await this.supabaseService.insert('chat_messages', messageData);
    }

    /**
     * Get a generic algorithmic response when AI is offline
     */
    private getGenericResponse(message: string): string {
        const lowerMessage = message.toLowerCase();
        
        // Greetings
        if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) return "Hello! I am the StressAway assistant. I can help guide you through our platform's wellness features. How can I support you today?";
        
        // Emotional States
        if (lowerMessage.match(/\b(stress|anxious|anxiety|worried|overwhelmed)\b/)) return "It sounds like you're experiencing some stress. Have you tried taking a few deep breaths or visiting our Wellness section for some calming exercises?";
        if (lowerMessage.match(/\b(help|emergency|sos)\b/)) return "I'm here for you! We have a dedicated SOS feature in the platform for emergencies. Please click the SOS button if you need urgent technical or mental health assistance.";
        if (lowerMessage.match(/\b(sad|depressed|down|crying|upset)\b/)) return "I'm sorry you're feeling that way. Please remember you're not alone. Consider reaching out to your connected psychologists or a trusted emergency contact from the connections tab.";
        
        // Platform Features
        if (lowerMessage.match(/\b(questionnaire|test|quiz|questions)\b/)) return "The Questionnaire evaluates your current stress levels through a series of thoughtful questions. Your responses help us build a personalized stress log for you.";
        if (lowerMessage.match(/\b(facial|camera|scan|emotion|face|video)\b/)) return "Our Facial Emotion feature uses your camera to quickly analyze your current mood and stress levels in real-time. Everything is processed securely.";
        if (lowerMessage.match(/\b(psychologist|therapist|counselor|doctor|connection|message)\b/)) return "You can browse and connect with professional psychologists on the psychologists page. Once connected, you can message them directly for personalized guidance.";
        if (lowerMessage.match(/\b(dashboard|charts|progress|log)\b/)) return "Your Dashboard provides a comprehensive view of your mental wellness journey. It includes history charts from your past questionnaires and facial scans.";
        if (lowerMessage.match(/\b(wellness|exercises|breathing|meditation|calm)\b/)) return "Our Wellness section contains curated materials, including breathing exercises and meditation techniques, designed specifically to help you decompress.";
        if (lowerMessage.match(/\b(stressaway|platform|about|who are you|what is this)\b/)) return "StressAway is a comprehensive mental wellness platform. We offer self-assessment tools like facial emotion scanning, questionnaires, wellness exercises, and direct messaging with professional psychologists.";
        
        return "I'm here to listen and help you navigate the platform. Whether you want to try a wellness exercise, log your stress, or connect with a psychologist, I'm here to support you.";
    }

    /**
     * Generate AI response with context
     */
    private async generateResponse(userId: string, currentMessage: string): Promise<string> {
        if (!this.genai && !this.openai) {
            return this.getGenericResponse(currentMessage);
        }

        const context = await this.getUserContext(userId);

        const systemPrompt = `You are the StressAway Mental Wellness Assistant. 
You provide empathetic, supportive advice based on the user's current stress data.
Be concise, use markdown formatting, and suggest using local platform features (like Wellness Activities, the Questionnaire, Facial Emotion Scans, or SOS Emergency).
Current User Data Context:
${context}

Instructions:
1. Do not explicitly state their numerical score unless they ask, just use it to guide your tone and suggestions.
2. Provide short, bulleted tips for relief if they seem stressed.
3. Be friendly, approachable, and non-judgmental.`;

        try {
            if (this.genai) {
                const response = await this.genai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        { role: 'user', parts: [{ text: systemPrompt + '\n\nUser Message: ' + currentMessage }] }
                    ]
                });
                return response.text;
            } else if (this.openai) {
                const response = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: currentMessage }
                    ]
                });
                return response.choices[0].message.content;
            }
        } catch (error) {
            this.logger.error('AI Generation Error:', error);
            return this.getGenericResponse(currentMessage);
        }

        return "I couldn't process this right now.";
    }

    /**
     * Fetch user's latest logs for contextual awareness
     */
    private async getUserContext(userId: string): Promise<string> {
        let contextText = "No recent data available.";

        try {
            // Get latest questionnaire
            const { data: qLogs } = await this.supabaseService.getClient()
                .from('questionnaire_stress_logs')
                .select('stress_score, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            // Get latest facial scan
            const { data: fLogs } = await this.supabaseService.getClient()
                .from('facial_stress_logs')
                .select('stress_score, detected_emotion, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            let logs = [];
            if (qLogs && qLogs.length > 0) {
                logs.push(`- Latest Questionnaire Score: ${qLogs[0].stress_score}/100 (Recorded: ${new Date(qLogs[0].created_at).toLocaleDateString()})`);
            }
            if (fLogs && fLogs.length > 0) {
                logs.push(`- Latest Facial Scan Score: ${fLogs[0].stress_score}/100, Detected Emotion: ${fLogs[0].detected_emotion} (Recorded: ${new Date(fLogs[0].created_at).toLocaleDateString()})`);
            }

            if (logs.length > 0) {
                contextText = logs.join('\n');
            }
        } catch (e) {
            this.logger.warn('Failed to fetch user context for AI prompt', e);
        }

        return contextText;
    }
}
