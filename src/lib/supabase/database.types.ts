
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "alert_destinations": {
                  Row: {
                    "alert_id": string,"created_at": string,"destination_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alert_id": string,"created_at"?: string,"destination_id": string,"user_id"?: string
                  }
                  Update: {
                    "alert_id"?: string,"created_at"?: string,"destination_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alert_destinations_alert_id_user_id_fkey"
      columns: ["alert_id","user_id"]
isOneToOne: false
      referencedRelation: "alerts"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "alert_destinations_destination_id_user_id_fkey"
      columns: ["destination_id","user_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"alerts": {
                  Row: {
                    "activated_at": string,"active": boolean,"category": Database["public"]['Enums']["event_category"],"created_at": string,"id": string,"keywords": (string)[],"min_severity": Database["public"]['Enums']["severity"] | null,"name": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activated_at"?: string,"active"?: boolean,"category": Database["public"]['Enums']["event_category"],"created_at"?: string,"id"?: string,"keywords"?: (string)[],"min_severity"?: Database["public"]['Enums']["severity"] | null,"name": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "activated_at"?: string,"active"?: boolean,"category"?: Database["public"]['Enums']["event_category"],"created_at"?: string,"id"?: string,"keywords"?: (string)[],"min_severity"?: Database["public"]['Enums']["severity"] | null,"name"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"destinations": {
                  Row: {
                    "broken_reason": string | null,"channel_type": string,"created_at": string,"hint": string | null,"id": string,"name": string,"settings": NonNullable<Json>,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "broken_reason"?: string | null,"channel_type": string,"created_at"?: string,"hint"?: string | null,"id"?: string,"name": string,"settings"?: NonNullable<Json>,"status"?: string,"user_id": string
                  }
                  Update: {
                    "broken_reason"?: string | null,"channel_type"?: string,"created_at"?: string,"hint"?: string | null,"id"?: string,"name"?: string,"settings"?: NonNullable<Json>,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"events": {
                  Row: {
                    "category": Database["public"]['Enums']["event_category"],"external_id": string,"id": string,"ingested_at": string,"matched_at": string | null,"occurred_at": string,"raw": NonNullable<Json>,"severity": Database["public"]['Enums']["severity"],"simulated": boolean,"source": string,"summary": string | null,"title": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["event_category"],"external_id": string,"id"?: string,"ingested_at"?: string,"matched_at"?: string | null,"occurred_at": string,"raw"?: NonNullable<Json>,"severity": Database["public"]['Enums']["severity"],"simulated"?: boolean,"source": string,"summary"?: string | null,"title": string,"url"?: string | null
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["event_category"],"external_id"?: string,"id"?: string,"ingested_at"?: string,"matched_at"?: string | null,"occurred_at"?: string,"raw"?: NonNullable<Json>,"severity"?: Database["public"]['Enums']["severity"],"simulated"?: boolean,"source"?: string,"summary"?: string | null,"title"?: string,"url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "alert_id": string | null,"attempts": number,"channel_type": string,"created_at": string,"destination_id": string | null,"event_id": string,"id": string,"last_error": string | null,"next_attempt_at": string,"sent_at": string | null,"skip_reason": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alert_id"?: string | null,"attempts"?: number,"channel_type": string,"created_at"?: string,"destination_id"?: string | null,"event_id": string,"id"?: string,"last_error"?: string | null,"next_attempt_at"?: string,"sent_at"?: string | null,"skip_reason"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "alert_id"?: string | null,"attempts"?: number,"channel_type"?: string,"created_at"?: string,"destination_id"?: string | null,"event_id"?: string,"id"?: string,"last_error"?: string | null,"next_attempt_at"?: string,"sent_at"?: string | null,"skip_reason"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_alert_id_fkey"
      columns: ["alert_id"]
isOneToOne: false
      referencedRelation: "alerts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"source_polls": {
                  Row: {
                    "error": string | null,"events_stored": number,"id": string,"outcome": string,"polled_at": string,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"events_stored"?: number,"id"?: string,"outcome": string,"polled_at"?: string,"source": string
                  }
                  Update: {
                    "error"?: string | null,"events_stored"?: number,"id"?: string,"outcome"?: string,"polled_at"?: string,"source"?: string
                  }
                  Relationships: [
                    
                  ]
                },"test_sends": {
                  Row: {
                    "channel_type": string,"created_at": string,"delivered": boolean | null,"destination_id": string | null,"error": string | null,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel_type": string,"created_at"?: string,"delivered"?: boolean | null,"destination_id"?: string | null,"error"?: string | null,"id"?: string,"user_id": string
                  }
                  Update: {
                    "channel_type"?: string,"created_at"?: string,"delivered"?: boolean | null,"destination_id"?: string | null,"error"?: string | null,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "test_sends_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_slack_destination":
{ Args: { "p_name": string,"p_url": string }; Returns: string
                           },
"admin_email_budget":
{ Args: Record<PropertyKey, never>; Returns: {
              "emails_today": number,"test_sends_today": number
            }[]
                           },
"admin_notifications":
{ Args: { "p_limit": number,"p_offset": number,"p_status": string }; Returns: {
              "attempts": number,"channel_type": string,"created_at": string,"event_occurred_at": string,"event_simulated": boolean,"event_title": string,"id": string,"last_error": string,"next_attempt_at": string,"owner_email": string,"sent_at": string,"skip_reason": string,"status": string,"total_count": number
            }[]
                           },
"admin_source_health":
{ Args: Record<PropertyKey, never>; Returns: {
              "last_error": string,"last_events_stored": number,"last_outcome": string,"last_polled_at": string,"last_success_at": string,"source": string
            }[]
                           },
"admin_users":
{ Args: { "p_limit": number,"p_offset": number }; Returns: {
              "alert_count": number,"created_at": string,"email": string,"role": string,"total_count": number,"user_id": string
            }[]
                           },
"claim_test_send":
{ Args: { "p_destination_id": string }; Returns: {
              "outcome": string,"test_send_id": string
            }[]
                           },
"email_usage":
{ Args: { "p_now": string,"p_user_id": string }; Returns: {
              "system_day": number,"user_hour": number
            }[]
                           },
"finish_test_send":
{ Args: { "p_broken_reason"?: string,"p_delivered": boolean,"p_error"?: string,"p_test_send_id": string }; Returns: undefined
                           },
"health_check":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"keywords_valid":
{ Args: { "p_keywords": (string)[] }; Returns: boolean
                           },
"remove_destination":
{ Args: { "p_destination_id": string }; Returns: {
              "alert_count": number,"outcome": string
            }[]
                           },
"save_alert":
{ Args: { "p_alert_id": string,"p_category": Database["public"]['Enums']["event_category"],"p_destination_ids": (string)[],"p_keywords": (string)[],"p_min_severity": Database["public"]['Enums']["severity"],"p_name": string }; Returns: string
                           },
"set_user_role":
{ Args: { "p_role": string,"p_user_id": string }; Returns: undefined
                           },
"simulate_event":
{ Args: { "p_category": Database["public"]['Enums']["event_category"],"p_severity": Database["public"]['Enums']["severity"],"p_summary"?: string,"p_title": string,"p_url"?: string }; Returns: string
                           },
"text_has_word":
{ Args: { "p_text": string,"p_word": string }; Returns: boolean
                           },
"tick_claim_notifications":
{ Args: { "p_batch"?: number,"p_lease_seconds"?: number,"p_now": string }; Returns: {
              "alert_name": string,"attempts": number,"channel_type": string,"destination_id": string,"destination_settings": Json,"event_category": Database["public"]['Enums']["event_category"],"event_occurred_at": string,"event_severity": Database["public"]['Enums']["severity"],"event_simulated": boolean,"event_source": string,"event_summary": string,"event_title": string,"event_url": string,"notification_id": string,"user_id": string
            }[]
                           },
"tick_match_events":
{ Args: { "p_batch"?: number,"p_emails_per_system_per_day": number,"p_emails_per_user_per_hour": number,"p_now": string }; Returns: {
              "events_matched": number,"notifications_created": number,"notifications_skipped": number
            }[]
                           }
          }
          Enums: {
            "event_category": "news"|"markets"|"natural_disasters","severity": "low"|"moderate"|"high"|"critical"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "event_category": ["news", "markets", "natural_disasters"],"severity": ["low", "moderate", "high", "critical"]
          }
        }
} as const
