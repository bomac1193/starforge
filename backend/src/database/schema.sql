-- Starforge Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Twin OS profiles
CREATE TABLE IF NOT EXISTS twin_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  voice_sample TEXT,
  visual_tone TEXT,
  capacity_score VARCHAR(50),
  personality_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ritual plans
CREATE TABLE IF NOT EXISTS ritual_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  track_name VARCHAR(255) NOT NULL,
  drop_date DATE NOT NULL,
  ritual_mode VARCHAR(50) NOT NULL,
  timeline JSONB NOT NULL,
  capacity VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Glow logs (daily energy tracking)
CREATE TABLE IF NOT EXISTS glow_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  glow_level INTEGER NOT NULL CHECK (glow_level >= 1 AND glow_level <= 5),
  notes TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_title VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_twin_profiles_user_id ON twin_profiles(user_id);
CREATE INDEX idx_ritual_plans_user_id ON ritual_plans(user_id);
CREATE INDEX idx_ritual_plans_status ON ritual_plans(status);
CREATE INDEX idx_glow_logs_user_date ON glow_logs(user_id, log_date);
CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date);
