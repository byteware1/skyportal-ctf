const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// === Initialize vulnerable SQLite database ===
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    category TEXT,
    image TEXT,
    released INTEGER DEFAULT 1
  );

  CREATE TABLE secret_data (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL
  );

  INSERT INTO products VALUES
    (1, 'Tactical Hoodie', 'Blend in with the masses', 29.99, 'Clothing', 'hoodie.jpg', 1),
    (2, 'Lock Pick Set', 'Professional grade, 21 piece', 49.99, 'Tools', 'lockpick.jpg', 1),
    (3, 'Raspberry Pi 5', 'Single board computer, 8GB RAM', 79.99, 'Hardware', 'rpi.jpg', 1),
    (4, 'Rubber Ducky', 'USB keystroke injection tool', 44.99, 'Hardware', 'ducky.jpg', 1),
    (5, 'Kali Linux Sticker Pack', '10 hacker stickers', 9.99, 'Merchandise', 'stickers.jpg', 1),
    (6, 'WiFi Pineapple', 'Advanced wifi auditing platform', 99.99, 'Hardware', 'pineapple.jpg', 1),
    (7, '[UNRELEASED] FLAG PRODUCT', 'FLAG{sql_injection_success_where_bypass}', 0.00, 'Secret', 'flag.jpg', 0),
    (8, '[UNRELEASED] Admin Console', 'Coming soon to premium members', 199.99, 'Software', 'console.jpg', 0);

  INSERT INTO secret_data VALUES
    (1, 'admin_flag', 'FLAG{union_attack_data_exfiltration}'),
    (2, 'db_version', 'SQLite 3.x'),
    (3, 'server_secret', 'sup3r_s3cr3t_k3y');
`);

// === VULNERABLE ENDPOINTS ===

// VULNERABILITY: Category filter with raw string concatenation
// Intended query: SELECT * FROM products WHERE category = 'X' AND released = 1
app.get('/api/products', (req, res) => {
  const category = req.query.category || '';
  
  try {
    // ⚠️  INTENTIONALLY VULNERABLE - DO NOT USE IN PRODUCTION
    const query = `SELECT id, name, description, price, category, image FROM products WHERE category = '${category}' AND released = 1`;
    
    let rows;
    try {
      rows = db.prepare(query).all();
    } catch (sqlErr) {
      // Return the error to help learners understand the injection
      return res.status(500).json({ 
        error: 'Database error',
        detail: sqlErr.message,
        query_hint: 'There was an issue with the database query'
      });
    }
    
    res.json({ products: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all categories (safe)
app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE released = 1').all();
  res.json(rows.map(r => r.category));
});

// Get all products without filtering (safe, but only shows released)
app.get('/api/products/all', (req, res) => {
  const rows = db.prepare('SELECT id, name, description, price, category, image FROM products WHERE released = 1').all();
  res.json({ products: rows });
});

// Serve the lab frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n💀 SQLi Lab running on port ${PORT}`);
  console.log(`⚠️  This application is INTENTIONALLY VULNERABLE`);
  console.log(`🎯 Objective: Find the unreleased products using SQL injection`);
});
