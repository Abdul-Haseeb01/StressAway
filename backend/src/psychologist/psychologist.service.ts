import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';

@Injectable()
export class PsychologistService {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Get detailed information for a specific connected patient.
     * Enforces that the requesting psychologist is currently connected to the patient.
     */
    async getPatientDetails(patientId: string, psychologistId: string) {
        // 1. Verify that an approved connection exists between this psychologist and the patient
        const { data: connection } = await this.supabaseService
            .getClient()
            .from('connections')
            .select('*')
            .eq('status', 'approved')
            .or(`and(user_id.eq.${patientId},connected_user_id.eq.${psychologistId}),and(user_id.eq.${psychologistId},connected_user_id.eq.${patientId})`)
            .single();

        if (!connection) {
            throw new ForbiddenException('You do not have access to this patient\'s records.');
        }

        // 2. Fetch User basic info
        const user = await this.supabaseService.findOne('users', patientId);
        if (!user) throw new NotFoundException('Patient not found');

        // 3. Fetch Profile
        const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('*')
            .eq('user_id', patientId)
            .single();

        // 4. Fetch Questionnaire Logs
        const { data: questionnaireLogs } = await this.supabaseService
            .getClient()
            .from('questionnaire_stress_logs')
            .select('*')
            .eq('user_id', patientId)
            .order('created_at', { ascending: false })
            .limit(50); // Increased limit

        // 5. Fetch Facial Logs (full data)
        const { data: facialLogs } = await this.supabaseService
            .getClient()
            .from('facial_stress_logs')
            .select('*')
            .eq('user_id', patientId)
            .order('created_at', { ascending: false })
            .limit(50); // Increased limit

        // 6. Fetch SOS Alert history (only those sent to THIS psychologist)
        const { data: sosAlerts } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .select('*')
            .eq('sender_id', patientId)
            .eq('recipient_id', psychologistId)
            .order('created_at', { ascending: false })
            .limit(10);

        return {
            patient: { ...user, profile },
            questionnaire_logs: questionnaireLogs || [],
            facial_logs: facialLogs || [],
            sos_alerts: sosAlerts || [],
        };
    }
}
