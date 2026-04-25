export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      agent_execution_logs: {
        Row: {
          agent_id: string;
          created_at: string | null;
          error_code: string | null;
          execution_time: number;
          id: string;
          input_hash: string;
          request_id: string;
          successful: boolean;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          agent_id: string;
          created_at?: string | null;
          error_code?: string | null;
          execution_time: number;
          id?: string;
          input_hash: string;
          request_id: string;
          successful: boolean;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string;
          created_at?: string | null;
          error_code?: string | null;
          execution_time?: number;
          id?: string;
          input_hash?: string;
          request_id?: string;
          successful?: boolean;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_execution_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agent_execution_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_conversations: {
        Row: {
          context_id: string | null;
          context_type: Database['public']['Enums']['ai_context_type'];
          created_at: string;
          id: string;
          is_archived: boolean;
          model_id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          context_id?: string | null;
          context_type?: Database['public']['Enums']['ai_context_type'];
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          model_id: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          context_id?: string | null;
          context_type?: Database['public']['Enums']['ai_context_type'];
          created_at?: string;
          id?: string;
          is_archived?: boolean;
          model_id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_generations: {
        Row: {
          agent_id: string | null;
          context_entity_id: string | null;
          context_entity_type: string | null;
          created_at: string;
          error_message: string | null;
          generation_type: Database['public']['Enums']['ai_generation_type'];
          id: string;
          input_params: Json;
          is_starred: boolean;
          is_successful: boolean;
          model_id: string | null;
          output_content: string;
          provider: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          agent_id?: string | null;
          context_entity_id?: string | null;
          context_entity_type?: string | null;
          created_at?: string;
          error_message?: string | null;
          generation_type: Database['public']['Enums']['ai_generation_type'];
          id?: string;
          input_params: Json;
          is_starred?: boolean;
          is_successful?: boolean;
          model_id?: string | null;
          output_content: string;
          provider?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agent_id?: string | null;
          context_entity_id?: string | null;
          context_entity_type?: string | null;
          created_at?: string;
          error_message?: string | null;
          generation_type?: Database['public']['Enums']['ai_generation_type'];
          id?: string;
          input_params?: Json;
          is_starred?: boolean;
          is_successful?: boolean;
          model_id?: string | null;
          output_content?: string;
          provider?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_generations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_generations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          is_helpful: boolean | null;
          latency_ms: number | null;
          model_id: string | null;
          role: Database['public']['Enums']['ai_message_role'];
          tokens_used: number | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_helpful?: boolean | null;
          latency_ms?: number | null;
          model_id?: string | null;
          role: Database['public']['Enums']['ai_message_role'];
          tokens_used?: number | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_helpful?: boolean | null;
          latency_ms?: number | null;
          model_id?: string | null;
          role?: Database['public']['Enums']['ai_message_role'];
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'ai_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_prompt_templates: {
        Row: {
          category: Database['public']['Enums']['ai_prompt_category'];
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          name: string;
          prompt_template: string;
          updated_at: string;
          variables: Json | null;
        };
        Insert: {
          category?: Database['public']['Enums']['ai_prompt_category'];
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name: string;
          prompt_template: string;
          updated_at?: string;
          variables?: Json | null;
        };
        Update: {
          category?: Database['public']['Enums']['ai_prompt_category'];
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name?: string;
          prompt_template?: string;
          updated_at?: string;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_prompt_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_prompt_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      ai_usage_stats: {
        Row: {
          created_at: string;
          date: string;
          error_count: number;
          id: string;
          model_id: string;
          request_count: number;
          total_latency_ms: number;
          total_tokens: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          error_count?: number;
          id?: string;
          model_id: string;
          request_count?: number;
          total_latency_ms?: number;
          total_tokens?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          error_count?: number;
          id?: string;
          model_id?: string;
          request_count?: number;
          total_latency_ms?: number;
          total_tokens?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_usage_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          key_hash: string;
          last_used_at: string | null;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key_hash: string;
          last_used_at?: string | null;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key_hash?: string;
          last_used_at?: string | null;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assignment_history: {
        Row: {
          assignment_id: string;
          change_type: string;
          changed_at: string | null;
          changed_by: string;
          created_at: string | null;
          id: string;
          new_data: Json;
          notes: string | null;
          previous_data: Json | null;
        };
        Insert: {
          assignment_id: string;
          change_type: string;
          changed_at?: string | null;
          changed_by: string;
          created_at?: string | null;
          id?: string;
          new_data: Json;
          notes?: string | null;
          previous_data?: Json | null;
        };
        Update: {
          assignment_id?: string;
          change_type?: string;
          changed_at?: string | null;
          changed_by?: string;
          created_at?: string | null;
          id?: string;
          new_data?: Json;
          notes?: string | null;
          previous_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignment_history_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'assignments';
            referencedColumns: ['id'];
          },
        ];
      };
      assignment_templates: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          teacher_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          teacher_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          teacher_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignment_templates_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignment_templates_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      assignments: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          lesson_id: string | null;
          status: Database['public']['Enums']['assignment_status'];
          student_id: string;
          teacher_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lesson_id?: string | null;
          status?: Database['public']['Enums']['assignment_status'];
          student_id: string;
          teacher_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lesson_id?: string | null;
          status?: Database['public']['Enums']['assignment_status'];
          student_id?: string;
          teacher_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'assignments_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      audit_log: {
        Row: {
          action: Database['public']['Enums']['audit_action'];
          actor_id: string | null;
          changes: Json;
          created_at: string;
          entity_id: string;
          entity_type: Database['public']['Enums']['audit_entity'];
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: Database['public']['Enums']['audit_action'];
          actor_id?: string | null;
          changes: Json;
          created_at?: string;
          entity_id: string;
          entity_type: Database['public']['Enums']['audit_entity'];
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: Database['public']['Enums']['audit_action'];
          actor_id?: string | null;
          changes?: Json;
          created_at?: string;
          entity_id?: string;
          entity_type?: Database['public']['Enums']['audit_entity'];
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      auth_rate_limits: {
        Row: {
          attempted_at: string;
          id: string;
          identifier: string;
          operation: string;
        };
        Insert: {
          attempted_at?: string;
          id?: string;
          identifier: string;
          operation: string;
        };
        Update: {
          attempted_at?: string;
          id?: string;
          identifier?: string;
          operation?: string;
        };
        Relationships: [];
      };
      lesson_history: {
        Row: {
          change_type: string;
          changed_at: string | null;
          changed_by: string;
          created_at: string | null;
          id: string;
          lesson_id: string;
          new_data: Json;
          notes: string | null;
          previous_data: Json | null;
        };
        Insert: {
          change_type: string;
          changed_at?: string | null;
          changed_by: string;
          created_at?: string | null;
          id?: string;
          lesson_id: string;
          new_data: Json;
          notes?: string | null;
          previous_data?: Json | null;
        };
        Update: {
          change_type?: string;
          changed_at?: string | null;
          changed_by?: string;
          created_at?: string | null;
          id?: string;
          lesson_id?: string;
          new_data?: Json;
          notes?: string | null;
          previous_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lesson_history_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      lesson_songs: {
        Row: {
          created_at: string;
          id: string;
          lesson_id: string;
          notes: string | null;
          song_id: string;
          status: Database['public']['Enums']['lesson_song_status'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lesson_id: string;
          notes?: string | null;
          song_id: string;
          status?: Database['public']['Enums']['lesson_song_status'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lesson_id?: string;
          notes?: string | null;
          song_id?: string;
          status?: Database['public']['Enums']['lesson_song_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lesson_songs_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_songs_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'song_usage_stats';
            referencedColumns: ['song_id'];
          },
          {
            foreignKeyName: 'lesson_songs_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      lessons: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          google_event_id: string | null;
          id: string;
          lesson_teacher_number: number;
          notes: string | null;
          scheduled_at: string;
          status: Database['public']['Enums']['lesson_status'];
          student_id: string;
          teacher_id: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          google_event_id?: string | null;
          id?: string;
          lesson_teacher_number?: number;
          notes?: string | null;
          scheduled_at: string;
          status?: Database['public']['Enums']['lesson_status'];
          student_id: string;
          teacher_id: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          google_event_id?: string | null;
          id?: string;
          lesson_teacher_number?: number;
          notes?: string | null;
          scheduled_at?: string;
          status?: Database['public']['Enums']['lesson_status'];
          student_id?: string;
          teacher_id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lessons_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      notification_log: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          error_message: string | null;
          id: string;
          max_retries: number;
          notification_type: string;
          recipient_email: string;
          recipient_user_id: string;
          retry_count: number;
          sent_at: string | null;
          status: string;
          subject: string;
          template_data: Json | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number;
          notification_type: string;
          recipient_email: string;
          recipient_user_id: string;
          retry_count?: number;
          sent_at?: string | null;
          status?: string;
          subject: string;
          template_data?: Json | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number;
          notification_type?: string;
          recipient_email?: string;
          recipient_user_id?: string;
          retry_count?: number;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_log_recipient_user_id_fkey';
            columns: ['recipient_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string;
          enabled: boolean;
          id: string;
          notification_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          notification_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          id?: string;
          notification_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_queue: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          notification_type: string;
          priority: number;
          processed_at: string | null;
          recipient_user_id: string;
          scheduled_for: string;
          status: string;
          template_data: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type: string;
          priority?: number;
          processed_at?: string | null;
          recipient_user_id: string;
          scheduled_for?: string;
          status?: string;
          template_data: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type?: string;
          priority?: number;
          processed_at?: string | null;
          recipient_user_id?: string;
          scheduled_for?: string;
          status?: string;
          template_data?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_queue_recipient_user_id_fkey';
            columns: ['recipient_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      pending_students: {
        Row: {
          created_at: string;
          created_by: string;
          email: string;
          full_name: string | null;
          id: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          email: string;
          full_name?: string | null;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pending_students_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pending_students_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      practice_sessions: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          notes: string | null;
          song_id: string | null;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          notes?: string | null;
          song_id?: string | null;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          song_id?: string | null;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'practice_sessions_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'song_usage_stats';
            referencedColumns: ['song_id'];
          },
          {
            foreignKeyName: 'practice_sessions_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practice_sessions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'practice_sessions_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          is_admin: boolean;
          is_development: boolean;
          is_shadow: boolean;
          is_student: boolean;
          is_teacher: boolean;
          lead_source: string | null;
          notes: string | null;
          onboarding_completed: boolean;
          phone: string | null;
          status_changed_at: string | null;
          student_status: Database['public']['Enums']['student_pipeline_status'] | null;
          updated_at: string;
          user_id: string | null;
          deletion_requested_at: string | null;
          deletion_scheduled_for: string | null;
          locked_until: string | null;
          failed_login_attempts: number | null;
          spotify_playlist_url: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          is_admin?: boolean;
          is_development?: boolean;
          is_shadow?: boolean;
          is_student?: boolean;
          is_teacher?: boolean;
          lead_source?: string | null;
          notes?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          status_changed_at?: string | null;
          student_status?: Database['public']['Enums']['student_pipeline_status'] | null;
          updated_at?: string;
          user_id?: string | null;
          deletion_requested_at?: string | null;
          deletion_scheduled_for?: string | null;
          locked_until?: string | null;
          failed_login_attempts?: number | null;
          spotify_playlist_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          is_admin?: boolean;
          is_development?: boolean;
          is_shadow?: boolean;
          is_student?: boolean;
          is_teacher?: boolean;
          lead_source?: string | null;
          notes?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          status_changed_at?: string | null;
          student_status?: Database['public']['Enums']['student_pipeline_status'] | null;
          updated_at?: string;
          user_id?: string | null;
          deletion_requested_at?: string | null;
          deletion_scheduled_for?: string | null;
          locked_until?: string | null;
          failed_login_attempts?: number | null;
          spotify_playlist_url?: string | null;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      song_status_history: {
        Row: {
          changed_at: string | null;
          created_at: string | null;
          id: string;
          new_status: string;
          notes: string | null;
          previous_status: string | null;
          song_id: string;
          student_id: string;
        };
        Insert: {
          changed_at?: string | null;
          created_at?: string | null;
          id?: string;
          new_status: string;
          notes?: string | null;
          previous_status?: string | null;
          song_id: string;
          student_id: string;
        };
        Update: {
          changed_at?: string | null;
          created_at?: string | null;
          id?: string;
          new_status?: string;
          notes?: string | null;
          previous_status?: string | null;
          song_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'song_status_history_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'song_usage_stats';
            referencedColumns: ['song_id'];
          },
          {
            foreignKeyName: 'song_status_history_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      song_sections: {
        Row: {
          id: string;
          song_id: string;
          section_type: string;
          section_number: number;
          order_position: number;
          chords: string[];
          lyrics: string | null;
          tab_notation: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          section_type: string;
          section_number?: number;
          order_position: number;
          chords?: string[];
          lyrics?: string | null;
          tab_notation?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          section_type?: string;
          section_number?: number;
          order_position?: number;
          chords?: string[];
          lyrics?: string | null;
          tab_notation?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'song_sections_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      song_videos: {
        Row: {
          id: string;
          song_id: string | null;
          uploaded_by: string;
          google_drive_file_id: string;
          google_drive_folder_id: string | null;
          title: string;
          filename: string;
          mime_type: string;
          file_size_bytes: number | null;
          duration_seconds: number | null;
          thumbnail_url: string | null;
          display_order: number;
          video_type: Database['public']['Enums']['video_type'];
          published_to_instagram: boolean;
          published_to_tiktok: boolean;
          published_to_youtube_shorts: boolean;
          instagram_media_id: string | null;
          tiktok_media_id: string | null;
          youtube_shorts_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id?: string | null;
          uploaded_by: string;
          google_drive_file_id: string;
          google_drive_folder_id?: string | null;
          title?: string;
          filename: string;
          mime_type: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          display_order?: number;
          video_type?: Database['public']['Enums']['video_type'];
          published_to_instagram?: boolean;
          published_to_tiktok?: boolean;
          published_to_youtube_shorts?: boolean;
          instagram_media_id?: string | null;
          tiktok_media_id?: string | null;
          youtube_shorts_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string | null;
          uploaded_by?: string;
          google_drive_file_id?: string;
          google_drive_folder_id?: string | null;
          title?: string;
          filename?: string;
          mime_type?: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          display_order?: number;
          video_type?: Database['public']['Enums']['video_type'];
          published_to_instagram?: boolean;
          published_to_tiktok?: boolean;
          published_to_youtube_shorts?: boolean;
          instagram_media_id?: string | null;
          tiktok_media_id?: string | null;
          youtube_shorts_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "song_videos_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          }
        ];
      };
      songs: {
        Row: {
          audio_files: Json | null;
          author: string | null;
          capo_fret: number | null;
          category: string | null;
          chords: string | null;
          cover_image_url: string | null;
          created_at: string;
          deleted_at: string | null;
          duration_ms: number | null;
          gallery_images: string[] | null;
          id: string;
          key: Database['public']['Enums']['music_key'] | null;
          level: Database['public']['Enums']['difficulty_level'] | null;
          lyrics_with_chords: string | null;
          release_year: number | null;
          search_vector: unknown;
          short_title: string | null;
          spotify_link_url: string | null;
          strumming_pattern: string | null;
          tempo: number | null;
          tiktok_short_url: string | null;
          time_signature: number | null;
          title: string;
          ultimate_guitar_link: string | null;
          updated_at: string;
          youtube_url: string | null;
        };
        Insert: {
          audio_files?: Json | null;
          author?: string | null;
          capo_fret?: number | null;
          category?: string | null;
          chords?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          duration_ms?: number | null;
          gallery_images?: string[] | null;
          id?: string;
          key?: Database['public']['Enums']['music_key'] | null;
          level?: Database['public']['Enums']['difficulty_level'] | null;
          lyrics_with_chords?: string | null;
          release_year?: number | null;
          search_vector?: unknown;
          short_title?: string | null;
          spotify_link_url?: string | null;
          strumming_pattern?: string | null;
          tempo?: number | null;
          tiktok_short_url?: string | null;
          time_signature?: number | null;
          title: string;
          ultimate_guitar_link?: string | null;
          updated_at?: string;
          youtube_url?: string | null;
        };
        Update: {
          audio_files?: Json | null;
          author?: string | null;
          capo_fret?: number | null;
          category?: string | null;
          chords?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          duration_ms?: number | null;
          gallery_images?: string[] | null;
          id?: string;
          key?: Database['public']['Enums']['music_key'] | null;
          level?: Database['public']['Enums']['difficulty_level'] | null;
          lyrics_with_chords?: string | null;
          release_year?: number | null;
          search_vector?: unknown;
          short_title?: string | null;
          spotify_link_url?: string | null;
          strumming_pattern?: string | null;
          tempo?: number | null;
          tiktok_short_url?: string | null;
          time_signature?: number | null;
          title?: string;
          ultimate_guitar_link?: string | null;
          updated_at?: string;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      song_requests: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          artist: string | null;
          notes: string | null;
          url: string | null;
          status: string;
          reviewed_by: string | null;
          review_notes: string | null;
          song_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          artist?: string | null;
          notes?: string | null;
          url?: string | null;
          status?: string;
          reviewed_by?: string | null;
          review_notes?: string | null;
          song_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          artist?: string | null;
          notes?: string | null;
          url?: string | null;
          status?: string;
          reviewed_by?: string | null;
          review_notes?: string | null;
          song_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'song_requests_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'song_requests_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'song_requests_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      spotify_matches: {
        Row: {
          ai_reasoning: string | null;
          confidence_score: number;
          created_at: string | null;
          id: string;
          match_reason: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          search_query: string;
          song_id: string;
          spotify_album_name: string | null;
          spotify_artist_name: string;
          spotify_cover_image_url: string | null;
          spotify_duration_ms: number | null;
          spotify_popularity: number | null;
          spotify_preview_url: string | null;
          spotify_release_date: string | null;
          spotify_track_id: string;
          spotify_track_name: string;
          spotify_url: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          ai_reasoning?: string | null;
          confidence_score: number;
          created_at?: string | null;
          id?: string;
          match_reason?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          search_query: string;
          song_id: string;
          spotify_album_name?: string | null;
          spotify_artist_name: string;
          spotify_cover_image_url?: string | null;
          spotify_duration_ms?: number | null;
          spotify_popularity?: number | null;
          spotify_preview_url?: string | null;
          spotify_release_date?: string | null;
          spotify_track_id: string;
          spotify_track_name: string;
          spotify_url: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ai_reasoning?: string | null;
          confidence_score?: number;
          created_at?: string | null;
          id?: string;
          match_reason?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          search_query?: string;
          song_id?: string;
          spotify_album_name?: string | null;
          spotify_artist_name?: string;
          spotify_cover_image_url?: string | null;
          spotify_duration_ms?: number | null;
          spotify_popularity?: number | null;
          spotify_preview_url?: string | null;
          spotify_release_date?: string | null;
          spotify_track_id?: string;
          spotify_track_name?: string;
          spotify_url?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'spotify_matches_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'song_usage_stats';
            referencedColumns: ['song_id'];
          },
          {
            foreignKeyName: 'spotify_matches_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      student_skills: {
        Row: {
          created_at: string | null;
          id: string;
          last_assessed_at: string | null;
          notes: string | null;
          skill_id: string;
          status: string;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_assessed_at?: string | null;
          notes?: string | null;
          skill_id: string;
          status: string;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_assessed_at?: string | null;
          notes?: string | null;
          skill_id?: string;
          status?: string;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_skills_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_skills_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      student_song_progress: {
        Row: {
          created_at: string;
          current_status: Database['public']['Enums']['lesson_song_status'];
          difficulty_rating: number | null;
          id: string;
          last_practiced_at: string | null;
          mastered_at: string | null;
          practice_session_count: number | null;
          song_id: string;
          started_at: string | null;
          student_id: string;
          student_notes: string | null;
          teacher_notes: string | null;
          total_practice_time_minutes: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_status?: Database['public']['Enums']['lesson_song_status'];
          difficulty_rating?: number | null;
          id?: string;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          practice_session_count?: number | null;
          song_id: string;
          started_at?: string | null;
          student_id: string;
          student_notes?: string | null;
          teacher_notes?: string | null;
          total_practice_time_minutes?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_status?: Database['public']['Enums']['lesson_song_status'];
          difficulty_rating?: number | null;
          id?: string;
          last_practiced_at?: string | null;
          mastered_at?: string | null;
          practice_session_count?: number | null;
          song_id?: string;
          started_at?: string | null;
          student_id?: string;
          student_notes?: string | null;
          teacher_notes?: string | null;
          total_practice_time_minutes?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_song_progress_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'song_usage_stats';
            referencedColumns: ['song_id'];
          },
          {
            foreignKeyName: 'student_song_progress_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_song_progress_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_song_progress_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      sync_conflicts: {
        Row: {
          conflict_data: Json;
          created_at: string;
          google_event_id: string;
          id: string;
          lesson_id: string;
          resolution: string | null;
          resolved_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          conflict_data: Json;
          created_at?: string;
          google_event_id: string;
          id?: string;
          lesson_id: string;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          conflict_data?: Json;
          created_at?: string;
          google_event_id?: string;
          id?: string;
          lesson_id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sync_conflicts_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      user_history: {
        Row: {
          change_type: string;
          changed_at: string;
          changed_by: string | null;
          id: string;
          new_data: Json | null;
          notes: string | null;
          previous_data: Json | null;
          user_id: string;
        };
        Insert: {
          change_type: string;
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          new_data?: Json | null;
          notes?: string | null;
          previous_data?: Json | null;
          user_id: string;
        };
        Update: {
          change_type?: string;
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          new_data?: Json | null;
          notes?: string | null;
          previous_data?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_integrations: {
        Row: {
          access_token: string | null;
          created_at: string;
          expires_at: number | null;
          provider: string;
          refresh_token: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token?: string | null;
          created_at?: string;
          expires_at?: number | null;
          provider: string;
          refresh_token?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string | null;
          created_at?: string;
          expires_at?: number | null;
          provider?: string;
          refresh_token?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          assigned_at: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          id?: string;
          role: Database['public']['Enums']['user_role'];
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      webhook_subscriptions: {
        Row: {
          channel_id: string;
          created_at: string;
          expiration: number;
          id: string;
          provider: string;
          resource_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string;
          expiration: number;
          id?: string;
          provider: string;
          resource_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string;
          expiration?: number;
          id?: string;
          provider?: string;
          resource_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          language: string;
          timezone: string;
          profile_visibility: string;
          show_email: boolean;
          show_last_seen: boolean;
          font_scheme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          language?: string;
          timezone?: string;
          profile_visibility?: string;
          show_email?: boolean;
          show_last_seen?: boolean;
          font_scheme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          language?: string;
          timezone?: string;
          profile_visibility?: string;
          show_email?: boolean;
          show_last_seen?: boolean;
          font_scheme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      lesson_counts_per_student: {
        Row: {
          student_id: string | null;
          total_lessons: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lessons_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      lesson_counts_per_teacher: {
        Row: {
          teacher_id: string | null;
          total_lessons: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lessons_teacher_id_fkey';
            columns: ['teacher_id'];
            isOneToOne: false;
            referencedRelation: 'user_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      song_usage_stats: {
        Row: {
          song_id: string | null;
          times_assigned: number | null;
          title: string | null;
        };
        Relationships: [];
      };
      user_overview: {
        Row: {
          created_at: string | null;
          email: string | null;
          is_admin: boolean | null;
          is_student: boolean | null;
          is_teacher: boolean | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_auth_rate_limit: {
        Args: { p_identifier: string; p_operation: string; p_window_ms: number };
        Returns: number;
      };
      cleanup_auth_rate_limits: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      has_active_lesson_assignments: {
        Args: { song_uuid: string };
        Returns: boolean;
      };
      has_role: {
        Args: { _role: Database['public']['Enums']['user_role'] };
        Returns: boolean;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_admin_or_teacher: { Args: Record<string, never>; Returns: boolean };
      is_student: { Args: Record<string, never>; Returns: boolean };
      is_teacher: { Args: Record<string, never>; Returns: boolean };
      show_limit: { Args: Record<string, never>; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      soft_delete_song_with_cascade: {
        Args: { song_uuid: string; user_uuid: string };
        Returns: Json;
      };
    };
    Enums: {
      ai_context_type: 'general' | 'student' | 'lesson' | 'song' | 'assignment' | 'practice';
      ai_generation_type:
      | 'lesson_notes'
      | 'assignment'
      | 'email_draft'
      | 'post_lesson_summary'
      | 'student_progress'
      | 'admin_insights'
      | 'chat';
      ai_message_role: 'system' | 'user' | 'assistant';
      ai_prompt_category:
      | 'email'
      | 'lesson_notes'
      | 'practice_plan'
      | 'progress_report'
      | 'feedback'
      | 'reminder'
      | 'custom';
      assignment_status:
      | 'not_started'
      | 'pending'
      | 'in_progress'
      | 'completed'
      | 'overdue'
      | 'cancelled';
      audit_action:
      | 'created'
      | 'updated'
      | 'deleted'
      | 'status_changed'
      | 'rescheduled'
      | 'cancelled'
      | 'completed'
      | 'role_changed';
      audit_entity: 'profile' | 'lesson' | 'assignment' | 'song' | 'song_progress';
      difficulty_level: 'beginner' | 'intermediate' | 'advanced';
      lesson_song_status: 'to_learn' | 'started' | 'remembered' | 'with_author' | 'mastered';
      lesson_status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
      music_key:
      | 'C'
      | 'C#'
      | 'Db'
      | 'D'
      | 'D#'
      | 'Eb'
      | 'E'
      | 'F'
      | 'F#'
      | 'Gb'
      | 'G'
      | 'G#'
      | 'Ab'
      | 'A'
      | 'A#'
      | 'Bb'
      | 'B'
      | 'Cm'
      | 'C#m'
      | 'Dm'
      | 'D#m'
      | 'Ebm'
      | 'Em'
      | 'Fm'
      | 'F#m'
      | 'Gm'
      | 'G#m'
      | 'Am'
      | 'A#m'
      | 'Bbm'
      | 'Bm';
      spotify_match_status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
      student_pipeline_status: 'lead' | 'trial' | 'active' | 'inactive' | 'churned';
      user_role: 'admin' | 'teacher' | 'student';
      video_type: 'tutorial' | 'short';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
  }
  ? R
  : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_context_type: ['general', 'student', 'lesson', 'song', 'assignment', 'practice'],
      ai_generation_type: [
        'lesson_notes',
        'assignment',
        'email_draft',
        'post_lesson_summary',
        'student_progress',
        'admin_insights',
        'chat',
      ],
      ai_message_role: ['system', 'user', 'assistant'],
      ai_prompt_category: [
        'email',
        'lesson_notes',
        'practice_plan',
        'progress_report',
        'feedback',
        'reminder',
        'custom',
      ],
      assignment_status: [
        'not_started',
        'pending',
        'in_progress',
        'completed',
        'overdue',
        'cancelled',
      ],
      audit_action: [
        'created',
        'updated',
        'deleted',
        'status_changed',
        'rescheduled',
        'cancelled',
        'completed',
        'role_changed',
      ],
      audit_entity: ['profile', 'lesson', 'assignment', 'song', 'song_progress'],
      difficulty_level: ['beginner', 'intermediate', 'advanced'],
      lesson_song_status: ['to_learn', 'started', 'remembered', 'with_author', 'mastered'],
      lesson_status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
      music_key: [
        'C',
        'C#',
        'Db',
        'D',
        'D#',
        'Eb',
        'E',
        'F',
        'F#',
        'Gb',
        'G',
        'G#',
        'Ab',
        'A',
        'A#',
        'Bb',
        'B',
        'Cm',
        'C#m',
        'Dm',
        'D#m',
        'Ebm',
        'Em',
        'Fm',
        'F#m',
        'Gm',
        'G#m',
        'Am',
        'A#m',
        'Bbm',
        'Bm',
      ],
      spotify_match_status: ['pending', 'approved', 'rejected', 'auto_applied'],
      student_pipeline_status: ['lead', 'trial', 'active', 'inactive', 'churned'],
      user_role: ['admin', 'teacher', 'student'],
      video_type: ['tutorial', 'short'],
    },
  },
} as const;
