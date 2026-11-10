-- ====================================================================
-- PostgreSQL Database Schema for PulseNearby (Node.js & Express)
-- ====================================================================

-- 1. Create database (run in psql if needed):
-- CREATE DATABASE pulsenearby;
-- \c pulsenearby;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  bio TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  is_online BOOLEAN DEFAULT true,
  status_message VARCHAR(150),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create index for fast username and location search
CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_city ON users (LOWER(city));

-- 4. Create chat messages table
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(100) PRIMARY KEY,
  sender_id VARCHAR(100) NOT NULL,
  receiver_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id, created_at DESC);

-- 5. Seed default initial user
INSERT INTO users (id, username, name, email, password, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message)
VALUES (
  'user_harsh_original',
  'harshsisodiya9425',
  'Harsh Sisodiya',
  'harshsisodiya9425@gmail.com',
  'password123',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  'Fullstack developer exploring social platforms with live location & chat.',
  28.6139,
  77.2090,
  'New Delhi',
  'Central',
  true,
  'Online on PulseNearby'
)
ON CONFLICT (username) DO NOTHING;
