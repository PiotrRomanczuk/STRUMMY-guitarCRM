export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_execution_logs: {
        Row: {
          agent_id: string
          created_at: string | null
          error_code: string | null
          execution_time: number
          id: string
          input_hash: string
          request_id: string
          successful: boolean
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          error_code?: string | null
          execution_time: number
          id?: string
          input_hash: string
          request_id: string
          successful: boolean
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          error_code?: string | null
          execution_time?: number
          id?: string
          input_hash?: string
          request_id?: string
          successful?: boolean
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: Database["public"]["Enums"]["ai_context_type"]
          created_at: string
          id: string
          is_archived: boolean
          model_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          is_archived?: boolean
          model_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: Database["public"]["Enums"]["ai_context_type"]
          created_at?: string
          id?: string
          is_archived?: boolean
          model_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          agent_id: string | null
          context_entity_id: string | null
          context_entity_type: string | null
          created_at: string
          error_message: string | null
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id: string
          input_params: Json
          is_starred: boolean
          is_successful: boolean
          model_id: string | null
          output_content: string
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string
          error_message?: string | null
          generation_type: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_params: Json
          is_starred?: boolean
          is_successful?: boolean
          model_id?: string | null
          output_content: string
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string
          error_message?: string | null
          generation_type?: Database["public"]["Enums"]["ai_generation_type"]
          id?: string
          input_params?: Json
          is_starred?: boolean
          is_successful?: boolean
          model_id?: string | null
          output_content?: string
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_helpful: boolean | null
          latency_ms: number | null
          model_id: string | null
          role: Database["public"]["Enums"]["ai_message_role"]
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          role: Database["public"]["Enums"]["ai_message_role"]
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          role?: Database["public"]["Enums"]["ai_message_role"]
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          category: Database["public"]["Enums"]["ai_prompt_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          prompt_template: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["ai_prompt_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          prompt_template: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: Database["public"]["Enums"]["ai_prompt_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          prompt_template?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompt_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_usage_stats: {
        Row: {
          created_at: string
          date: string
          error_count: number
          id: string
          model_id: string
          request_count: number
          total_latency_ms: number
          total_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          error_count?: number
          id?: string
          model_id: string
          request_count?: number
          total_latency_ms?: number
          total_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          error_count?: number
          id?: string
          model_id?: string
          request_count?: number
          total_latency_ms?: number
          total_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apple_shortcut_song_import_log: {
        Row: {
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          song_artist: string | null
          song_id: string | null
          song_title: string | null
          source: string
          spotify_track_id: string | null
          spotify_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          song_artist?: string | null
          song_id?: string | null
          song_title?: string | null
          source?: string
          spotify_track_id?: string | null
          spotify_url?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          song_artist?: string | null
          song_id?: string | null
          song_title?: string | null
          source?: string
          spotify_track_id?: string | null
          spotify_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apple_shortcut_song_import_log_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "apple_shortcut_song_import_log_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "apple_shortcut_song_import_log_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "apple_shortcut_song_import_log_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_history: {
        Row: {
          assignment_id: string
          change_type: string
          changed_at: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_data: Json
          notes: string | null
          previous_data: Json | null
        }
        Insert: {
          assignment_id: string
          change_type: string
          changed_at?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_data: Json
          notes?: string | null
          previous_data?: Json | null
        }
        Update: {
          assignment_id?: string
          change_type?: string
          changed_at?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_data?: Json
          notes?: string | null
          previous_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_history_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_history_changed_by"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignment_history_changed_by"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assignment_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lesson_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          student_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          student_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lesson_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          student_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auth_rate_limits: {
        Row: {
          attempted_at: string
          id: string
          identifier: string
          operation: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          identifier: string
          operation: string
        }
        Update: {
          attempted_at?: string
          id?: string
          identifier?: string
          operation?: string
        }
        Relationships: []
      }
      drive_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          display_order: number
          entity_id: string
          entity_type: string
          file_size_bytes: number | null
          file_type: string
          filename: string
          google_drive_file_id: string
          google_drive_folder_id: string | null
          id: string
          metadata: Json | null
          mime_type: string
          title: string | null
          updated_at: string
          uploaded_by: string
          visibility: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          entity_id: string
          entity_type: string
          file_size_bytes?: number | null
          file_type: string
          filename: string
          google_drive_file_id: string
          google_drive_folder_id?: string | null
          id?: string
          metadata?: Json | null
          mime_type: string
          title?: string | null
          updated_at?: string
          uploaded_by: string
          visibility?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          entity_id?: string
          entity_type?: string
          file_size_bytes?: number | null
          file_type?: string
          filename?: string
          google_drive_file_id?: string
          google_drive_folder_id?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string
          visibility?: string
        }
        Relationships: []
      }
      in_app_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string
          icon: string | null
          id: string
          is_read: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: number
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
          variant: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority?: number
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: number
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "in_app_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_app_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_history: {
        Row: {
          change_type: string
          changed_at: string | null
          changed_by: string
          created_at: string | null
          id: string
          lesson_id: string
          new_data: Json
          notes: string | null
          previous_data: Json | null
        }
        Insert: {
          change_type: string
          changed_at?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          lesson_id: string
          new_data: Json
          notes?: string | null
          previous_data?: Json | null
        }
        Update: {
          change_type?: string
          changed_at?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          new_data?: Json
          notes?: string | null
          previous_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_history_changed_by"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_history_changed_by"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_songs: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          notes: string | null
          repertoire_id: string | null
          song_id: string
          status: Database["public"]["Enums"]["lesson_song_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          notes?: string | null
          repertoire_id?: string | null
          song_id: string
          status?: Database["public"]["Enums"]["lesson_song_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          notes?: string | null
          repertoire_id?: string | null
          song_id?: string
          status?: Database["public"]["Enums"]["lesson_song_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_songs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_songs_repertoire_id_fkey"
            columns: ["repertoire_id"]
            isOneToOne: false
            referencedRelation: "student_repertoire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "lesson_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "lesson_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "lesson_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          deleted_at: string | null
          google_event_id: string | null
          id: string
          lesson_teacher_number: number
          notes: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          teacher_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          google_event_id?: string | null
          id?: string
          lesson_teacher_number: number
          notes?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          teacher_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          google_event_id?: string | null
          id?: string
          lesson_teacher_number?: number
          notes?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id?: string
          teacher_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
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

      practice_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          song_id: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          notes?: string | null
          song_id?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          song_id?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "practice_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "practice_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "practice_sessions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          confirmed_active_at: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          email: string
          failed_login_attempts: number
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_admin: boolean
          is_development: boolean
          is_parent: boolean
          is_shadow: boolean | null
          is_student: boolean
          is_teacher: boolean
          last_name: string | null
          last_sign_in_at: string | null
          lead_source: string | null
          locked_until: string | null
          notes: string | null
          onboarding_completed: boolean
          parent_id: string | null
          phone: string | null
          sign_in_count: number
          spotify_playlist_url: string | null
          status_changed_at: string | null
          student_status: Database["public"]["Enums"]["student_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          confirmed_active_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email: string
          failed_login_attempts?: number
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          is_development?: boolean
          is_parent?: boolean
          is_shadow?: boolean | null
          is_student?: boolean
          is_teacher?: boolean
          last_name?: string | null
          last_sign_in_at?: string | null
          lead_source?: string | null
          locked_until?: string | null
          notes?: string | null
          onboarding_completed?: boolean
          parent_id?: string | null
          phone?: string | null
          sign_in_count?: number
          spotify_playlist_url?: string | null
          status_changed_at?: string | null
          student_status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          confirmed_active_at?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email?: string
          failed_login_attempts?: number
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          is_development?: boolean
          is_parent?: boolean
          is_shadow?: boolean | null
          is_student?: boolean
          is_teacher?: boolean
          last_name?: string | null
          last_sign_in_at?: string | null
          lead_source?: string | null
          locked_until?: string | null
          notes?: string | null
          onboarding_completed?: boolean
          parent_id?: string | null
          phone?: string | null
          sign_in_count?: number
          spotify_playlist_url?: string | null
          status_changed_at?: string | null
          student_status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_of_the_week: {
        Row: {
          active_from: string
          active_until: string | null
          created_at: string
          id: string
          is_active: boolean
          selected_by: string
          song_id: string
          teacher_message: string | null
          updated_at: string
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          selected_by: string
          song_id: string
          teacher_message?: string | null
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          selected_by?: string
          song_id?: string
          teacher_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_of_the_week_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_of_the_week_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "song_of_the_week_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_of_the_week_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_of_the_week_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_of_the_week_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_requests: {
        Row: {
          artist: string | null
          created_at: string
          id: string
          notes: string | null
          review_notes: string | null
          reviewed_by: string | null
          song_id: string | null
          status: string
          student_id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          song_id?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          song_id?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "song_requests_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_requests_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_requests_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_requests_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_sections: {
        Row: {
          chords: string[]
          created_at: string
          id: string
          lyrics: string | null
          notes: string | null
          order_position: number
          section_number: number
          section_type: string
          song_id: string
          tab_notation: string | null
        }
        Insert: {
          chords?: string[]
          created_at?: string
          id?: string
          lyrics?: string | null
          notes?: string | null
          order_position: number
          section_number?: number
          section_type: string
          song_id: string
          tab_notation?: string | null
        }
        Update: {
          chords?: string[]
          created_at?: string
          id?: string
          lyrics?: string | null
          notes?: string | null
          order_position?: number
          section_number?: number
          section_type?: string
          song_id?: string
          tab_notation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_sections_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_status_history: {
        Row: {
          changed_at: string | null
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
          song_id: string
          student_id: string
        }
        Insert: {
          changed_at?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
          song_id: string
          student_id: string
        }
        Update: {
          changed_at?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
          song_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_status_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_status_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_status_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_status_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_status_history_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_status_history_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      song_videos: {
        Row: {
          created_at: string
          display_order: number
          duration_seconds: number | null
          file_size_bytes: number | null
          filename: string
          google_drive_file_id: string
          google_drive_folder_id: string | null
          id: string
          instagram_media_id: string | null
          is_audio_mixed: boolean
          is_recording_correct: boolean
          is_video_edited: boolean
          is_well_lit: boolean
          match_confidence: number | null
          match_source: string | null
          mic_type: string | null
          mime_type: string
          published_to_instagram: boolean
          published_to_tiktok: boolean
          published_to_youtube_shorts: boolean
          song_id: string
          thumbnail_url: string | null
          tiktok_media_id: string | null
          title: string
          updated_at: string
          uploaded_by: string
          youtube_shorts_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          file_size_bytes?: number | null
          filename: string
          google_drive_file_id: string
          google_drive_folder_id?: string | null
          id?: string
          instagram_media_id?: string | null
          is_audio_mixed?: boolean
          is_recording_correct?: boolean
          is_video_edited?: boolean
          is_well_lit?: boolean
          match_confidence?: number | null
          match_source?: string | null
          mic_type?: string | null
          mime_type: string
          published_to_instagram?: boolean
          published_to_tiktok?: boolean
          published_to_youtube_shorts?: boolean
          song_id: string
          thumbnail_url?: string | null
          tiktok_media_id?: string | null
          title?: string
          updated_at?: string
          uploaded_by: string
          youtube_shorts_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          file_size_bytes?: number | null
          filename?: string
          google_drive_file_id?: string
          google_drive_folder_id?: string | null
          id?: string
          instagram_media_id?: string | null
          is_audio_mixed?: boolean
          is_recording_correct?: boolean
          is_video_edited?: boolean
          is_well_lit?: boolean
          match_confidence?: number | null
          match_source?: string | null
          mic_type?: string | null
          mime_type?: string
          published_to_instagram?: boolean
          published_to_tiktok?: boolean
          published_to_youtube_shorts?: boolean
          song_id?: string
          thumbnail_url?: string | null
          tiktok_media_id?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          youtube_shorts_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "song_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          audio_files: Json | null
          author: string | null
          capo_fret: number | null
          category: string | null
          chords: string | null
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          duration_ms: number | null
          gallery_images: string[] | null
          id: string
          is_draft: boolean
          key: Database["public"]["Enums"]["music_key"] | null
          level: Database["public"]["Enums"]["difficulty_level"] | null
          lyrics_with_chords: string | null
          notes: string | null
          release_year: number | null
          search_vector: unknown
          short_title: string | null
          spotify_link_url: string | null
          strumming_pattern: string | null
          tempo: number | null
          tiktok_short_url: string | null
          time_signature: number | null
          title: string
          ultimate_guitar_link: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          audio_files?: Json | null
          author?: string | null
          capo_fret?: number | null
          category?: string | null
          chords?: string | null
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          gallery_images?: string[] | null
          id?: string
          is_draft?: boolean
          key?: Database["public"]["Enums"]["music_key"] | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          lyrics_with_chords?: string | null
          notes?: string | null
          release_year?: number | null
          search_vector?: unknown
          short_title?: string | null
          spotify_link_url?: string | null
          strumming_pattern?: string | null
          tempo?: number | null
          tiktok_short_url?: string | null
          time_signature?: number | null
          title: string
          ultimate_guitar_link?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          audio_files?: Json | null
          author?: string | null
          capo_fret?: number | null
          category?: string | null
          chords?: string | null
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          gallery_images?: string[] | null
          id?: string
          is_draft?: boolean
          key?: Database["public"]["Enums"]["music_key"] | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          lyrics_with_chords?: string | null
          notes?: string | null
          release_year?: number | null
          search_vector?: unknown
          short_title?: string | null
          spotify_link_url?: string | null
          strumming_pattern?: string | null
          tempo?: number | null
          tiktok_short_url?: string | null
          time_signature?: number | null
          title?: string
          ultimate_guitar_link?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      spotify_matches: {
        Row: {
          ai_reasoning: string | null
          confidence_score: number
          created_at: string | null
          id: string
          match_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_query: string
          song_id: string
          spotify_album_name: string | null
          spotify_artist_name: string
          spotify_cover_image_url: string | null
          spotify_duration_ms: number | null
          spotify_popularity: number | null
          spotify_preview_url: string | null
          spotify_release_date: string | null
          spotify_track_id: string
          spotify_track_name: string
          spotify_url: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          confidence_score: number
          created_at?: string | null
          id?: string
          match_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_query: string
          song_id: string
          spotify_album_name?: string | null
          spotify_artist_name: string
          spotify_cover_image_url?: string | null
          spotify_duration_ms?: number | null
          spotify_popularity?: number | null
          spotify_preview_url?: string | null
          spotify_release_date?: string | null
          spotify_track_id: string
          spotify_track_name: string
          spotify_url: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          confidence_score?: number
          created_at?: string | null
          id?: string
          match_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_query?: string
          song_id?: string
          spotify_album_name?: string | null
          spotify_artist_name?: string
          spotify_cover_image_url?: string | null
          spotify_duration_ms?: number | null
          spotify_popularity?: number | null
          spotify_preview_url?: string | null
          spotify_release_date?: string | null
          spotify_track_id?: string
          spotify_track_name?: string
          spotify_url?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotify_matches_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "spotify_matches_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "spotify_matches_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "spotify_matches_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_repertoire: {
        Row: {
          assigned_by: string | null
          capo_fret: number | null
          created_at: string
          current_status: Database["public"]["Enums"]["song_progress_status"]
          custom_strumming: string | null
          difficulty_rating: number | null
          id: string
          is_active: boolean | null
          last_practiced_at: string | null
          mastered_at: string | null
          practice_session_count: number | null
          preferred_key: Database["public"]["Enums"]["music_key"] | null
          priority: string | null
          self_rating: number | null
          self_rating_updated_at: string | null
          song_id: string
          sort_order: number | null
          started_at: string | null
          student_id: string
          student_notes: string | null
          teacher_notes: string | null
          total_practice_minutes: number | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          capo_fret?: number | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["song_progress_status"]
          custom_strumming?: string | null
          difficulty_rating?: number | null
          id?: string
          is_active?: boolean | null
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_session_count?: number | null
          preferred_key?: Database["public"]["Enums"]["music_key"] | null
          priority?: string | null
          self_rating?: number | null
          self_rating_updated_at?: string | null
          song_id: string
          sort_order?: number | null
          started_at?: string | null
          student_id: string
          student_notes?: string | null
          teacher_notes?: string | null
          total_practice_minutes?: number | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          capo_fret?: number | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["song_progress_status"]
          custom_strumming?: string | null
          difficulty_rating?: number | null
          id?: string
          is_active?: boolean | null
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_session_count?: number | null
          preferred_key?: Database["public"]["Enums"]["music_key"] | null
          priority?: string | null
          self_rating?: number | null
          self_rating_updated_at?: string | null
          song_id?: string
          sort_order?: number | null
          started_at?: string | null
          student_id?: string
          student_notes?: string | null
          teacher_notes?: string | null
          total_practice_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_repertoire_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_repertoire_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_repertoire_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_repertoire_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_repertoire_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_repertoire_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_repertoire_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_repertoire_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_song_progress: {
        Row: {
          created_at: string
          current_status: Database["public"]["Enums"]["lesson_song_status"]
          difficulty_rating: number | null
          id: string
          last_practiced_at: string | null
          mastered_at: string | null
          practice_session_count: number | null
          song_id: string
          started_at: string | null
          student_id: string
          student_notes: string | null
          teacher_notes: string | null
          total_practice_time_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_status?: Database["public"]["Enums"]["lesson_song_status"]
          difficulty_rating?: number | null
          id?: string
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_session_count?: number | null
          song_id: string
          started_at?: string | null
          student_id: string
          student_notes?: string | null
          teacher_notes?: string | null
          total_practice_time_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_status?: Database["public"]["Enums"]["lesson_song_status"]
          difficulty_rating?: number | null
          id?: string
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_session_count?: number | null
          song_id?: string
          started_at?: string | null
          student_id?: string
          student_notes?: string | null
          teacher_notes?: string | null
          total_practice_time_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_song_progress_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_engagement"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_song_progress_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "mv_song_popularity"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_song_progress_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_usage_stats"
            referencedColumns: ["song_id"]
          },
          {
            foreignKeyName: "student_song_progress_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_song_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_song_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      theoretical_course_access: {
        Row: {
          course_id: string
          granted_at: string
          granted_by: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          granted_at?: string
          granted_by: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theoretical_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "theoretical_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theoretical_course_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theoretical_course_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "theoretical_course_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theoretical_course_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      theoretical_courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          is_published: boolean
          level: string
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          level?: string
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          level?: string
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theoretical_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theoretical_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      theoretical_lessons: {
        Row: {
          content: string
          course_id: string
          created_at: string
          deleted_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theoretical_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "theoretical_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_history: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          notes: string | null
          previous_data: Json | null
          user_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          user_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          notes?: string | null
          previous_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: number | null
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          expiration: number
          id: string
          provider: string
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          expiration: number
          id?: string
          provider: string
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          expiration?: number
          id?: string
          provider?: string
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      lesson_counts_per_student: {
        Row: {
          student_id: string | null
          total_lessons: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_counts_per_teacher: {
        Row: {
          teacher_id: string | null
          total_lessons: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mv_song_engagement: {
        Row: {
          active_learners: number | null
          author: string | null
          avg_difficulty: number | null
          avg_practice_minutes: number | null
          category: string | null
          key: string | null
          last_activity: string | null
          lesson_appearances: number | null
          level: string | null
          mastered_count: number | null
          song_id: string | null
          title: string | null
          total_students: number | null
        }
        Relationships: []
      }
      mv_song_popularity: {
        Row: {
          author: string | null
          avg_difficulty_rating: number | null
          level: string | null
          mastery_count: number | null
          mastery_rate: number | null
          song_id: string | null
          times_assigned: number | null
          title: string | null
          unique_students: number | null
        }
        Relationships: []
      }
      song_usage_stats: {
        Row: {
          song_id: string | null
          times_assigned: number | null
          title: string | null
        }
        Relationships: []
      }
      teacher_students: {
        Row: {
          student_id: string | null
          teacher_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_overview"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_overview: {
        Row: {
          created_at: string | null
          email: string | null
          is_admin: boolean | null
          is_student: boolean | null
          is_teacher: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_auth_rate_limit: {
        Args: { p_identifier: string; p_operation: string; p_window_ms: number }
        Returns: number
      }
      cleanup_auth_rate_limits: { Args: never; Returns: undefined }
      find_similar_songs: {
        Args: { max_results?: number; search_title: string; threshold?: number }
        Returns: {
          author: string
          id: string
          similarity: number
          title: string
        }[]
      }
      has_active_lesson_assignments: {
        Args: { song_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      increment_sign_in_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_teacher: { Args: never; Returns: boolean }
      is_child_of_parent: { Args: { _student_id: string }; Returns: boolean }
      is_parent: { Args: never; Returns: boolean }
      is_student: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      refresh_song_engagement: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_song_with_cascade: {
        Args: { song_uuid: string; user_uuid: string }
        Returns: Json
      }
      title_case: { Args: { input: string }; Returns: string }
    }
    Enums: {
      ai_context_type:
        | "general"
        | "student"
        | "lesson"
        | "song"
        | "assignment"
        | "practice"
      ai_generation_type:
        | "lesson_notes"
        | "assignment"
        | "email_draft"
        | "post_lesson_summary"
        | "student_progress"
        | "admin_insights"
        | "chat"
      ai_message_role: "system" | "user" | "assistant"
      ai_prompt_category:
        | "email"
        | "lesson_notes"
        | "practice_plan"
        | "progress_report"
        | "feedback"
        | "reminder"
        | "custom"
      assignment_status:
        | "not_started"
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "cancelled"
      difficulty_level: "beginner" | "intermediate" | "advanced"
      lesson_song_status:
        | "to_learn"
        | "started"
        | "remembered"
        | "slow_tempo"
        | "with_author"
        | "mastered"
      lesson_status:
        | "SCHEDULED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "RESCHEDULED"
      music_key:
        | "C"
        | "C#"
        | "Db"
        | "D"
        | "D#"
        | "Eb"
        | "E"
        | "F"
        | "F#"
        | "Gb"
        | "G"
        | "G#"
        | "Ab"
        | "A"
        | "A#"
        | "Bb"
        | "B"
        | "Cm"
        | "C#m"
        | "Dm"
        | "D#m"
        | "Ebm"
        | "Em"
        | "Fm"
        | "F#m"
        | "Gm"
        | "G#m"
        | "Am"
        | "A#m"
        | "Bbm"
        | "Bm"
      notification_type:
        | "lesson_reminder_24h"
        | "lesson_recap"
        | "lesson_cancelled"
        | "lesson_rescheduled"
        | "assignment_created"
        | "assignment_due_reminder"
        | "assignment_overdue_alert"
        | "assignment_completed"
        | "song_mastery_achievement"
        | "milestone_reached"
        | "student_welcome"
        | "trial_ending_reminder"
        | "teacher_daily_summary"
        | "weekly_progress_digest"
        | "calendar_conflict_alert"
        | "webhook_expiration_notice"
        | "admin_error_alert"
      song_progress_status:
        | "to_learn"
        | "started"
        | "remembered"
        | "with_author"
        | "mastered"
      student_pipeline_status:
        | "lead"
        | "trial"
        | "active"
        | "inactive"
        | "churned"
      student_status: "active" | "archived"
      user_role: "admin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_context_type: [
        "general",
        "student",
        "lesson",
        "song",
        "assignment",
        "practice",
      ],
      ai_generation_type: [
        "lesson_notes",
        "assignment",
        "email_draft",
        "post_lesson_summary",
        "student_progress",
        "admin_insights",
        "chat",
      ],
      ai_message_role: ["system", "user", "assistant"],
      ai_prompt_category: [
        "email",
        "lesson_notes",
        "practice_plan",
        "progress_report",
        "feedback",
        "reminder",
        "custom",
      ],
      assignment_status: [
        "not_started",
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
      ],
      difficulty_level: ["beginner", "intermediate", "advanced"],
      lesson_song_status: [
        "to_learn",
        "started",
        "remembered",
        "slow_tempo",
        "with_author",
        "mastered",
      ],
      lesson_status: [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "RESCHEDULED",
      ],
      music_key: [
        "C",
        "C#",
        "Db",
        "D",
        "D#",
        "Eb",
        "E",
        "F",
        "F#",
        "Gb",
        "G",
        "G#",
        "Ab",
        "A",
        "A#",
        "Bb",
        "B",
        "Cm",
        "C#m",
        "Dm",
        "D#m",
        "Ebm",
        "Em",
        "Fm",
        "F#m",
        "Gm",
        "G#m",
        "Am",
        "A#m",
        "Bbm",
        "Bm",
      ],
      notification_type: [
        "lesson_reminder_24h",
        "lesson_recap",
        "lesson_cancelled",
        "lesson_rescheduled",
        "assignment_created",
        "assignment_due_reminder",
        "assignment_overdue_alert",
        "assignment_completed",
        "song_mastery_achievement",
        "milestone_reached",
        "student_welcome",
        "trial_ending_reminder",
        "teacher_daily_summary",
        "weekly_progress_digest",
        "calendar_conflict_alert",
        "webhook_expiration_notice",
        "admin_error_alert",
      ],
      song_progress_status: [
        "to_learn",
        "started",
        "remembered",
        "with_author",
        "mastered",
      ],
      student_pipeline_status: [
        "lead",
        "trial",
        "active",
        "inactive",
        "churned",
      ],
      student_status: ["active", "archived"],
      user_role: ["admin", "teacher", "student"],
    },
  },
} as const
