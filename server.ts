import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// ============================================================================
// PostgreSQL Database Connection & In-Memory Fallback
// ============================================================================
const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'postgres';
const pgHost = process.env.PGHOST || 'localhost';
const pgPort = Number(process.env.PGPORT) || 5432;
const pgDatabase = process.env.PGDATABASE || 'pulsenearby';

// Only use DATABASE_URL if specifically provided without overriding individual settings
const hasCustomPgPassword = Boolean(process.env.PGPASSWORD);
const isDefaultDatabaseUrl =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes(':postgres@') ||
  process.env.DATABASE_URL.includes(':yourpassword@');

const poolConfig =
  process.env.DATABASE_URL && !hasCustomPgPassword && !isDefaultDatabaseUrl
    ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 4000 }
    : {
        host: pgHost,
        port: pgPort,
        user: pgUser,
        password: pgPassword,
        database: pgDatabase,
        connectionTimeoutMillis: 4000,
      };

let pool = new Pool(poolConfig);
let isPostgresConnected = false;
let lastDbError: string | null = null;

// In-memory fallback store if PostgreSQL is not active locally yet
interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string;
  is_online: boolean;
  status_message: string;
  last_active: string;
}

interface MessageRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

let memoryUsers: UserRecord[] = [
  {
    id: 'user_harsh_original',
    username: 'harshsisodiya9425',
    name: 'Harsh Sisodiya',
    email: 'harshsisodiya9425@gmail.com',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    bio: 'Fullstack developer exploring social platforms with live location & chat.',
    latitude: 28.6139,
    longitude: 77.209,
    city: 'New Delhi',
    neighborhood: 'Central',
    is_online: true,
    status_message: 'Online on PulseNearby',
    last_active: 'Active now',
  },
];

let memoryMessages: MessageRecord[] = [];

// Initialize PostgreSQL Tables
async function initDatabase() {
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log('✅ Connected to PostgreSQL database successfully.');

    await client.query(`
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

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        sender_id VARCHAR(100) NOT NULL,
        receiver_id VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default user into PostgreSQL if empty
    const res = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(res.rows[0].count, 10) === 0) {
      const u = memoryUsers[0];
      await client.query(
        `INSERT INTO users (id, username, name, email, password, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          u.id,
          u.username,
          u.name,
          u.email,
          u.password,
          u.avatar,
          u.bio,
          u.latitude,
          u.longitude,
          u.city,
          u.neighborhood,
          u.is_online,
          u.status_message,
        ]
      );
      console.log('🌱 Seeded default user Harsh Sisodiya into PostgreSQL users table.');
    }

    client.release();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    lastDbError = msg;

    // Self-healing: If "pulsenearby" database does not exist, auto-create it using the default 'postgres' database!
    if (msg.includes('does not exist') && msg.includes(pgDatabase)) {
      console.log(`ℹ️ Database "${pgDatabase}" does not exist yet. Attempting to create it automatically...`);
      try {
        const rootPool = new Pool({
          host: pgHost,
          port: pgPort,
          user: pgUser,
          password: pgPassword,
          database: 'postgres',
          connectionTimeoutMillis: 4000,
        });
        const rootClient = await rootPool.connect();
        await rootClient.query(`CREATE DATABASE "${pgDatabase}"`);
        rootClient.release();
        await rootPool.end();
        console.log(`🎉 Database "${pgDatabase}" created automatically! Connecting...`);

        // Reconnect pool to newly created database
        pool = new Pool(poolConfig);
        const retryClient = await pool.connect();
        isPostgresConnected = true;
        console.log(`✅ Connected to newly created PostgreSQL database "${pgDatabase}" successfully.`);
        retryClient.release();
        return;
      } catch (autoErr: unknown) {
        console.warn(`Could not auto-create database "${pgDatabase}": ${(autoErr as Error).message}`);
      }
    }

    isPostgresConnected = false;
    console.warn(`⚠️ PostgreSQL connection to ${pgHost}:${pgPort} as user "${pgUser}" failed: ${msg}`);

    if (msg.includes('password authentication failed')) {
      console.warn('🔑 Password authentication failed! Please open your .env file and set PGPASSWORD to your actual PostgreSQL password.');
    } else if (msg.includes('ECONNREFUSED')) {
      console.warn(`🔌 Connection refused on ${pgHost}:${pgPort}! PostgreSQL service is stopped. Open services.msc and start "postgresql-x64-XX", or run: Start-Service postgresql*`);
    }

    console.warn('ℹ️ Running on seamless in-memory fallback until your local PostgreSQL is started.');
  }
}

initDatabase();

// ============================================================================
// REST API Endpoints
// ============================================================================

// 1. Health & Database Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: isPostgresConnected ? 'postgresql' : 'in-memory-fallback',
    connected: isPostgresConnected,
    dbHost: `${pgHost}:${pgPort}`,
    dbUser: pgUser,
    dbName: pgDatabase,
    error: lastDbError,
    message: isPostgresConnected
      ? `Connected to local PostgreSQL database "${pgDatabase}"`
      : `Using in-memory fallback (${lastDbError || 'not connected'})`,
  });
});

app.get('/api/db-status', (req: Request, res: Response) => {
  res.json({
    connected: isPostgresConnected,
    host: pgHost,
    port: pgPort,
    user: pgUser,
    database: pgDatabase,
    error: lastDbError,
  });
});

// 2. Authentication: Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, username, email, password, city, neighborhood, latitude, longitude } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();
    const id = `user_${Date.now()}_${cleanUsername}`;
    const avatar =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

    if (isPostgresConnected) {
      // Check existing
      const existing = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
        [cleanUsername, cleanEmail]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      const insertRes = await pool.query(
        `INSERT INTO users (id, username, name, email, password, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 'Online on PulseNearby')
         RETURNING id, username, name, email, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message`,
        [
          id,
          cleanUsername,
          name.trim(),
          cleanEmail,
          password.trim(),
          avatar,
          `Hi, I'm ${name} on PulseNearby.`,
          Number(latitude) || 28.6139,
          Number(longitude) || 77.209,
          city || 'New Delhi',
          neighborhood || 'Central',
        ]
      );
      return res.status(201).json(insertRes.rows[0]);
    } else {
      const exists = memoryUsers.some(
        (u) => u.username === cleanUsername || u.email.toLowerCase() === cleanEmail
      );
      if (exists) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      const newUser: UserRecord = {
        id,
        username: cleanUsername,
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        avatar,
        bio: `Hi, I'm ${name} on PulseNearby.`,
        latitude: Number(latitude) || 28.6139,
        longitude: Number(longitude) || 77.209,
        city: city || 'New Delhi',
        neighborhood: neighborhood || 'Central',
        is_online: true,
        status_message: 'Online on PulseNearby',
        last_active: 'Active now',
      };
      memoryUsers.unshift(newUser);
      return res.status(201).json(newUser);
    }
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Authentication: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing username/email or password' });
    }

    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');
    const cleanPw = password.trim();

    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
        [cleanId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No account found with this username or email' });
      }

      const user = result.rows[0];
      if (user.password !== cleanPw) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      delete user.password;
      return res.json(user);
    } else {
      const user = memoryUsers.find(
        (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
      );
      if (!user) {
        return res.status(404).json({ error: 'No account found with this username or email' });
      }
      if (user.password !== cleanPw) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
      return res.json(user);
    }
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 4. Fetch All Users (with distance calculation)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT id, username, name, email, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message, last_active FROM users'
      );
      return res.json(result.rows);
    } else {
      return res.json(memoryUsers);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Add / Register New Person
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { name, username, email, city, neighborhood, latitude, longitude, status_message, bio, avatar } = req.body;
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const id = `user_${Date.now()}_${cleanUsername}`;

    if (isPostgresConnected) {
      const insert = await pool.query(
        `INSERT INTO users (id, username, name, email, password, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message)
         VALUES ($1, $2, $3, $4, 'password123', $5, $6, $7, $8, $9, $10, true, $11)
         RETURNING id, username, name, email, avatar, bio, latitude, longitude, city, neighborhood, is_online, status_message`,
        [
          id,
          cleanUsername,
          name,
          email || `${cleanUsername}@example.com`,
          avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
          bio || `Hi, I am ${name}`,
          Number(latitude),
          Number(longitude),
          city || 'New Delhi',
          neighborhood || 'Central',
          status_message || 'Available to chat',
        ]
      );
      return res.status(201).json(insert.rows[0]);
    } else {
      const newUser: UserRecord = {
        id,
        username: cleanUsername,
        name,
        email: email || `${cleanUsername}@example.com`,
        avatar: avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: bio || `Hi, I am ${name}`,
        latitude: Number(latitude),
        longitude: Number(longitude),
        city: city || 'New Delhi',
        neighborhood: neighborhood || 'Central',
        is_online: true,
        status_message: status_message || 'Available to chat',
        last_active: 'Active now',
      };
      memoryUsers.unshift(newUser);
      return res.status(201).json(newUser);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update User Location
app.put('/api/users/:id/location', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, city } = req.body;

    if (isPostgresConnected) {
      await pool.query(
        'UPDATE users SET latitude = $1, longitude = $2, city = COALESCE($3, city), last_active = NOW() WHERE id = $4',
        [Number(latitude), Number(longitude), city, id]
      );
    } else {
      const u = memoryUsers.find((user) => user.id === id);
      if (u) {
        u.latitude = Number(latitude);
        u.longitude = Number(longitude);
        if (city) u.city = city;
        u.last_active = 'Active now';
      }
    }
    res.json({ success: true, latitude, longitude, city });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete User
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isPostgresConnected) {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } else {
      memoryUsers = memoryUsers.filter((u) => u.id !== id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Fetch Messages Thread
app.get('/api/messages/:userA/:userB', async (req: Request, res: Response) => {
  try {
    const { userA, userB } = req.params;
    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT id, sender_id, receiver_id, content AS text, message_type AS type, is_read, created_at AS timestamp
         FROM messages 
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC`,
        [userA, userB]
      );
      return res.json(result.rows);
    } else {
      const thread = memoryMessages.filter(
        (m) =>
          (m.sender_id === userA && m.receiver_id === userB) ||
          (m.sender_id === userB && m.receiver_id === userA)
      );
      return res.json(
        thread.map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          text: m.content,
          type: m.message_type,
          isRead: m.is_read,
          timestamp: m.created_at,
        }))
      );
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Send Message
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, text, type } = req.body;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isPostgresConnected) {
      await pool.query(
        `INSERT INTO messages (id, sender_id, receiver_id, content, message_type, is_read)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [id, senderId, receiverId, text, type || 'text']
      );
    } else {
      memoryMessages.push({
        id,
        sender_id: senderId,
        receiver_id: receiverId,
        content: text,
        message_type: type || 'text',
        is_read: false,
        created_at: timeStr,
      });
    }

    res.status(201).json({
      id,
      senderId,
      receiverId,
      text,
      type: type || 'text',
      isRead: false,
      timestamp: timeStr,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Mount Vite Development Server in Dev Mode
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PulseNearby Node.js + Express backend running at http://localhost:${PORT}`);
  });
}

startServer();
