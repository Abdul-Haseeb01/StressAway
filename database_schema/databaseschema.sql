-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  message text NOT NULL,
  is_user_message boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.connections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  connected_user_id uuid,
  connection_type USER-DEFINED NOT NULL CHECK (connection_type = 'psychologist'::connection_type),
  status USER-DEFINED DEFAULT 'pending'::connection_status,
  requested_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_sos_contact boolean DEFAULT false,
  CONSTRAINT connections_pkey PRIMARY KEY (id),
  CONSTRAINT connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT connections_connected_user_id_fkey FOREIGN KEY (connected_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  connection_id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT direct_messages_pkey PRIMARY KEY (id),
  CONSTRAINT direct_messages_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.connections(id),
  CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.facial_stress_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  stress_score numeric NOT NULL,
  detected_emotion USER-DEFINED NOT NULL,
  emotion_probabilities jsonb NOT NULL,
  confidence numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT facial_stress_logs_pkey PRIMARY KEY (id),
  CONSTRAINT facial_stress_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.family_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connected_user_id uuid NOT NULL,
  family_role text NOT NULL DEFAULT 'other'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  is_sos_contact boolean DEFAULT false,
  share_logs_to_user boolean DEFAULT false,
  share_logs_to_connected boolean DEFAULT false,
  CONSTRAINT family_connections_pkey PRIMARY KEY (id),
  CONSTRAINT family_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT family_connections_connected_user_id_fkey FOREIGN KEY (connected_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  full_name character varying,
  phone character varying,
  date_of_birth date,
  gender character varying,
  avatar_url text,
  bio text,
  emergency_contact_phone character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.questionnaire_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_text text NOT NULL,
  question_order integer NOT NULL,
  weight numeric DEFAULT 1.0,
  min_value integer DEFAULT 1,
  max_value integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questionnaire_questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.questionnaire_stress_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  stress_score numeric NOT NULL,
  responses jsonb NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questionnaire_stress_logs_pkey PRIMARY KEY (id),
  CONSTRAINT questionnaire_stress_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.sos_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sos_contact_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT sos_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT sos_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT sos_contacts_sos_contact_id_fkey FOREIGN KEY (sos_contact_id) REFERENCES public.users(id)
);
CREATE TABLE public.sos_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT sos_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT sos_notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT sos_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  role USER-DEFINED DEFAULT 'user'::user_role,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);