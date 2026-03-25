#!/usr/bin/env bash
# ============================================================
# SkyPortal New Lab Template Generator
# Usage: ./labs/new-lab.sh <lab-slug> <lab-name>
# Example: ./labs/new-lab.sh sqli-union "SQL Injection UNION Attack"
# ============================================================

SLUG=${1:-my-new-lab}
NAME=${2:-"My New Lab"}
DIR="labs/${SLUG}"

mkdir -p "${DIR}/public"

cat > "${DIR}/package.json" << EOF
{
  "name": "skyportal-lab-${SLUG}",
  "version": "1.0.0",
  "description": "${NAME}",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3"
  }
}
EOF

cat > "${DIR}/server.js" << 'EOF'
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const db = new Database(':memory:');

// TODO: Setup your vulnerable database schema here
db.exec(`
  CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT, secret INTEGER DEFAULT 0);
  INSERT INTO items VALUES (1, 'Public Item', 0);
  INSERT INTO items VALUES (2, 'FLAG{your_flag_here}', 1);
`);

// TODO: Add your vulnerable endpoints here
// ⚠️ REMEMBER: This is intentionally vulnerable - DO NOT use in production

app.get('/api/items', (req, res) => {
  const query = req.query.filter || '';
  // VULNERABLE: unsanitized input
  try {
    const rows = db.prepare(`SELECT id, name FROM items WHERE secret = 0 AND name LIKE '%${query}%'`).all();
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Lab "${process.env.LAB_ID || 'dev'}" running on port ${PORT}`);
});
EOF

cat > "${DIR}/Dockerfile" << EOF
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN addgroup -g 1001 -S labuser && adduser -S labuser -u 1001
USER labuser
EXPOSE 3000
LABEL skyportal.lab="${SLUG}" skyportal.managed="true"
CMD ["node", "server.js"]
EOF

cat > "${DIR}/public/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${NAME}</title>
  <style>
    body { background: #0a0a0f; color: #dde1f0; font-family: monospace; padding: 40px; }
    h1 { color: #00e5ff; margin-bottom: 16px; }
    .hint { background: rgba(0,136,255,0.1); border: 1px solid rgba(0,136,255,0.3); padding: 14px; border-radius: 6px; color: #8890b0; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${NAME}</h1>
  <div class="hint">🎯 Lab Objective: TODO - describe what the user should do</div>
  <p>TODO: Add your lab UI here</p>
</body>
</html>
EOF

echo "✅ Lab template created at: ${DIR}"
echo ""
echo "Next steps:"
echo "  1. Edit ${DIR}/server.js — add your vulnerability"
echo "  2. Edit ${DIR}/public/index.html — build the lab UI"
echo "  3. Build: docker build -t skyportal/lab-${SLUG} ${DIR}"
echo "  4. Add to DB: INSERT INTO labs (...) VALUES (...)"
