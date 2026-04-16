// Supabase Service - Database connection and operations
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        // Initialize Supabase client with environment variables
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
        );
    }

    /**
     * Get the Supabase client instance
     */
    getClient(): SupabaseClient {
        return this.supabase;
    }

    /**
     * Execute a database query
     */
    async query(table: string) {
        return this.supabase.from(table);
    }

    /**
     * Insert data into a table
     */
    async insert(table: string, data: any) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(data)
            .select();

        if (error) throw error;
        return result;
    }

    /**
     * Update data in a table
     */
    async update(table: string, id: string, data: any) {
        const { data: result, error } = await this.supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select();

        if (error) throw error;
        return result;
    }

    /**
     * Delete data from a table
     */
    async delete(table: string, id: string) {
        const { error } = await this.supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }

    async findOne(table: string, id: string) {
        const { data, error } = await this.supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // PGRST116 is the error code for "JSON object requested, multiple (or no) rows returned", which happens on .single() with 0 rows
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        return data;
    }

    /**
     * Find records with filters
     */
    async find(table: string, filters: any = {}) {
        let query = this.supabase.from(table).select('*');

        // Apply filters
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    /**
     * Execute custom SQL query
     */
    async rpc(functionName: string, params: any = {}) {
        const { data, error } = await this.supabase.rpc(functionName, params);

        if (error) throw error;
        return data;
    }
}
