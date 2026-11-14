-- MediQ Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    floor VARCHAR(20) DEFAULT '1st Floor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    specialization VARCHAR(120) NOT NULL,
    cabin_number VARCHAR(20) NOT NULL,
    avg_consultation_mins INT DEFAULT 12,
    status VARCHAR(30) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'IN_CONSULTATION', 'ON_BREAK', 'OFF_DUTY'
    current_delay_mins INT DEFAULT 0,
    delay_reason TEXT DEFAULT '',
    is_paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Queues Table
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    queue_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'CLOSED'
    current_serving_token_id UUID,
    total_issued INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Queue Tokens Table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(20) NOT NULL,
    queue_id UUID REFERENCES queues(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name VARCHAR(120) NOT NULL,
    patient_phone VARCHAR(20),
    patient_age INT,
    patient_gender VARCHAR(10),
    priority VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'EMERGENCY', 'SENIOR'
    status VARCHAR(30) DEFAULT 'WAITING', -- 'WAITING', 'CALLING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    initial_eta_mins INT DEFAULT 0,
    estimated_call_time TIMESTAMP WITH TIME ZONE,
    called_at TIMESTAMP WITH TIME ZONE,
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    qr_code_data TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue Event Logs Table for Audit and Analytics
CREATE TABLE IF NOT EXISTS queue_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'REGISTERED', 'CALLED', 'CONSULTATION_STARTED', 'COMPLETED', 'DELAY_ADDED', 'CANCELLED', 'NO_SHOW'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinic Settings Table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_name VARCHAR(150) DEFAULT 'MediQ General Hospital & Specialty Clinic',
    tagline VARCHAR(200) DEFAULT 'Smart, Dignified Patient Queue Management',
    address TEXT DEFAULT '450 Healthcare Boulevard, Suite 100',
    phone VARCHAR(30) DEFAULT '+1 (555) 019-2834',
    emergency_number VARCHAR(30) DEFAULT '+1 (555) 911-0000',
    consultation_buffer_mins INT DEFAULT 2,
    enable_audio_call BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Supabase Realtime for Tokens and Doctors tables
ALTER PUBLICATION supabase_realtime ADD TABLE tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE queues;

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_tokens_queue ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_doctor ON tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);

