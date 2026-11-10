# PulseNearby - Social Geolocation & Live Chat

A modern, full-stack social networking web application built with **Node.js, Express, React, Tailwind CSS, Leaflet, and PostgreSQL**.

---

## 🚀 How to Run Locally on Your Computer

### Step 1: Prerequisites
Make sure you have installed on your computer:
1. **Node.js** (v18 or higher): [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** (v14, 15, or 16): [Download PostgreSQL](https://www.postgresql.org/download/)

---

### Step 2: Set Up the PostgreSQL Database

1. Open your terminal or `psql` (or pgAdmin) and create a database named `pulsenearby`:
   ```sql
   CREATE DATABASE pulsenearby;
   ```

2. Run the provided `schema.sql` file to create the tables:
   ```bash
   psql -U postgres -d pulsenearby -f schema.sql
   ```
   *(Enter your PostgreSQL password when prompted)*

---

### Step 3: Configure Environment Variables

1. Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and verify your PostgreSQL credentials:
   ```env
   # Option A: Connection string
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pulsenearby"

   # Option B: Individual variables
   PGHOST="localhost"
   PGPORT="5432"
   PGUSER="postgres"
   PGPASSWORD="yourpassword"
   PGDATABASE="pulsenearby"
   PORT="3000"
   ```

---

### Step 4: Install Dependencies & Run the App

1. Install all project dependencies:
   ```bash
   npm install
   ```

2. Start the unified Node.js Express server + Vite frontend:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

*(Note: The server includes an automatic in-memory fallback, so even if PostgreSQL is momentarily not running, the application stays fully functional without crashing!)*

---

## 📁 Full-Stack Project Structure

```
├── server.ts                 # Full-stack Node.js + Express backend server
├── schema.sql                # PostgreSQL DDL schema & indexes
├── package.json              # Project dependencies & scripts
├── index.html                # Frontend entrypoint
├── src/
│   ├── App.tsx               # Main React Application
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginPage.tsx # Real Name, Username, Email, Password Auth
│   │   ├── Map/
│   │   │   └── SocialMap.tsx # Interactive Leaflet Geolocation Map & Radar
│   │   ├── Chat/
│   │   │   ├── ChatDrawer.tsx        # 1-on-1 real-time live chat drawer
│   │   │   └── ConversationsList.tsx # Active chat threads
│   │   ├── Directory/
│   │   │   ├── PeopleList.tsx        # People directory cards
│   │   │   └── AddUserModal.tsx      # Add/register new person modal
│   │   ├── Search/
│   │   │   └── SearchFilterBar.tsx   # Username & Location search
│   │   └── Profile/
│   │       ├── UserProfileModal.tsx  # User info popup
│   │       └── EditProfileModal.tsx  # Edit personal profile
│   ├── data/
│   │   └── mockUsers.ts      # Client user storage & calculation helpers
│   ├── utils/
│   │   ├── geo.ts            # Haversine distance calculations
│   │   └── audio.ts          # Web Audio notification synthesizer
│   └── types/
│       └── index.ts          # TypeScript interfaces
```

---

## 🛠️ API Endpoints in `server.ts`

- `POST /api/auth/register` - Create an account with Real Name, Username, Email, and Password
- `POST /api/auth/login` - Authenticate using email/username and password
- `GET /api/users` - Fetch registered users
- `POST /api/users` - Add a new person with map coordinates
- `PUT /api/users/:id/location` - Update coordinates when user moves pin or uses GPS
- `DELETE /api/users/:id` - Remove a user
- `GET /api/messages/:userA/:userB` - Fetch direct message thread
- `POST /api/messages` - Send a real-time message
