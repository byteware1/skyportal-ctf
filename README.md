# 🛡️ SkyPortal — Cybersecurity Training Platform

A self-hosted CTF / Cyber Range platform for practicing web exploitation techniques in isolated Docker environments. Inspired by PortSwigger Web Security Academy.

```
   _____ _           ____             _        _
  / ____| |         |  _ \           | |      | |
 | (___ | | ___   _ | |_) | ___  _ __| |_ __ _| |
  \___ \| |/ / | | ||  __/ / _ \| '__| __/ _` | |
  ____) |   <| |_| || |   | (_) | |  | || (_| | |
 |_____/|_|\_\\__, ||_|    \___/|_|   \__\__,_|_|
               __/ |
              |___/
```

---

## ✨ Features

- **Authentication** — JWT-based register/login with bcrypt password hashing
- **Lab System** — Labs grouped by category with difficulty levels (Apprentice → Expert)
- **Docker Isolation** — Each lab runs in its own container with CPU/RAM limits
- **Auto-expiry** — Containers auto-deleted after configurable timeout
- **Flag System** — Submit flags to mark labs as completed
- **Progress Tracking** — Per-user stats, category breakdowns, progress bars
- **Hints System** — Reveal hints incrementally (tracked per lab)
- **Leaderboard** — Global ranking by labs solved
- **Admin Panel** — User management, container monitoring, lab toggle
- **Dark Theme** — Terminal-style hacker aesthetic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS / Server                        │
│                                                           │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐ │
│  │  Nginx   │───▶│ Frontend │    │     PostgreSQL      │ │
│  │ :80/:443 │    │ React    │    │   (main database)   │ │
│  └──────────┘    └──────────┘    └────────────────────┘ │
│       │                                   ▲              │
│       ▼                                   │              │
│  ┌──────────┐                    ┌────────────────────┐ │
│  │ Backend  │────────────────────│   Docker Socket    │ │
│  │ Node/    │                    │ (container mgmt)   │ │
│  │ Express  │                    └────────────────────┘ │
│  └──────────┘                                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Lab Containers  (ports 10000-11000)         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │ │
│  │  │ SQLi Lab │  │ XSS Lab  │  │ Auth Lab │  ...      │ │
│  │  │ :10001   │  │ :10002   │  │ :10003   │          │ │
│  │  └──────────┘  └──────────┘  └──────────┘          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- VPS with ports 80, 443, 10000-11000 open in firewall

### 1. Clone & Configure

```bash
git clone https://github.com/youruser/skyportal.git
cd skyportal

# Copy and edit environment variables
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DB_PASSWORD=your_strong_db_password
JWT_SECRET=your_64_char_random_secret
LAB_HOST=your.server.ip.or.domain
```

Generate a secure JWT secret:
```bash
openssl rand -hex 64
```

### 2. Build Lab Docker Images

```bash
# Build the SQL Injection lab image
cd labs/sqli-lab-01
docker build -t skyportal/lab-sqli-01 .
cd ../..
```

### 3. Start the Platform

```bash
docker compose up -d
```

### 4. Verify

```bash
# Check all services are running
docker compose ps

# View logs
docker compose logs -f backend

# Test API health
curl http://localhost:4000/api/health
```

### 5. Access

- **Platform**: `http://your-server-ip`
- **Default admin**: username `admin`, password `Admin@SkyPortal2024`
- ⚠️ **Change the admin password immediately after first login**

---

## 🔥 Firewall Setup

### UFW (Ubuntu)

```bash
# Allow web traffic
ufw allow 80/tcp
ufw allow 443/tcp

# Allow lab container port range
ufw allow 10000:11000/tcp

# Block lab containers from accessing internal network
# (Optional but recommended)
ufw deny out from 172.16.0.0/12 to 192.168.0.0/16
```

### iptables

```bash
# Allow lab port range
iptables -A INPUT -p tcp --dport 10000:11000 -j ACCEPT
```

---

## 🐳 Adding New Labs

### 1. Create lab directory

```
labs/
  your-lab-name/
    Dockerfile
    server.js          # Your vulnerable app
    package.json
    public/
      index.html       # Lab UI
```

### 2. Build the image

```bash
docker build -t skyportal/lab-your-name ./labs/your-lab-name
```

### 3. Add lab to database

```sql
INSERT INTO labs (
  title, slug, category_id, difficulty, description,
  objectives, hints, flag, docker_image, docker_port,
  timeout_minutes
) VALUES (
  'Your Lab Title',
  'your-lab-slug',
  1,  -- category_id (1=SQLi, 2=XSS, 3=Auth, etc.)
  'Apprentice',
  'Lab description...',
  ARRAY['Objective 1', 'Objective 2'],
  ARRAY['Hint 1', 'Hint 2', 'Hint 3'],
  'FLAG{your_flag_here}',
  'skyportal/lab-your-name',
  3000,
  30
);
```

Or use the Admin Panel → Labs tab.

### Lab Security Requirements

Your lab Dockerfile must:

```dockerfile
# Drop all capabilities
# Use non-root user
# Label with skyportal.managed=true for cleanup tracking

LABEL skyportal.managed="true"
RUN adduser -S labuser && ...
USER labuser
```

The backend automatically applies these container constraints:
- CPU: 0.5 cores max
- RAM: 256MB max
- `no-new-privileges` security option
- All capabilities dropped except minimal set
- Auto-remove on stop

---

## 📁 Project Structure

```
skyportal/
├── docker-compose.yml          # Main orchestration
├── .env.example                # Environment template
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── backend/
│   ├── Dockerfile
│   ├── server.js               # Express app entry
│   ├── package.json
│   ├── db/
│   │   ├── pool.js             # PostgreSQL connection
│   │   └── init.sql            # Schema + seed data
│   ├── middleware/
│   │   └── auth.js             # JWT authentication
│   ├── routes/
│   │   ├── auth.js             # Register/login/me
│   │   ├── labs.js             # Lab listing + hints
│   │   ├── containers.js       # Start/stop containers
│   │   ├── flags.js            # Flag submission
│   │   ├── users.js            # Progress + leaderboard
│   │   └── admin.js            # Admin endpoints
│   └── services/
│       └── containerManager.js # Docker integration
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Router + auth guards
│       ├── index.css           # Global dark theme
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state
│       ├── lib/
│       │   └── api.js          # API client
│       ├── components/
│       │   └── Layout.jsx      # Sidebar navigation
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── DashboardPage.jsx
│           ├── LabsPage.jsx
│           ├── LabDetailPage.jsx
│           ├── LeaderboardPage.jsx
│           └── AdminPage.jsx
└── labs/
    └── sqli-lab-01/            # SQL Injection lab
        ├── Dockerfile
        ├── server.js           # Vulnerable Express app
        ├── package.json
        └── public/
            └── index.html      # Lab UI (HackMart shop)
```

---

## 🔐 Security Notes

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| Auth tokens | JWT, 7-day expiry |
| Rate limiting | express-rate-limit on all routes |
| Container isolation | Docker + capability dropping |
| Resource limits | 0.5 CPU / 256MB RAM per container |
| Container timeout | Auto-delete after 30min (configurable) |
| SQL injection (platform) | Parameterized queries everywhere |
| No shared state | Each lab container is ephemeral |
| Admin access | Role-based, separate middleware |

---

## 🧪 Included Labs

### SQL Injection
| Lab | Difficulty | Goal |
|---|---|---|
| WHERE clause bypass | Apprentice | Retrieve unreleased products via `OR 1=1` |
| UNION attack | Practitioner | Extract data from other tables |

### XSS
| Lab | Difficulty | Goal |
|---|---|---|
| Reflected XSS | Apprentice | Execute `alert()` via search input |

### Authentication
| Lab | Difficulty | Goal |
|---|---|---|
| Username enumeration | Apprentice | Enumerate valid usernames via response differences |

---

## 🛠️ Development

### Run backend locally

```bash
cd backend
npm install
cp .env.example .env
# Start postgres separately, then:
node server.js
```

### Run frontend locally

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:4000/api npm start
```

### Test the SQLi lab directly

```bash
cd labs/sqli-lab-01
npm install
node server.js
# Open http://localhost:3000
# Try: Hardware' OR 1=1--
```

---

## 📄 License

MIT — build something cool.
