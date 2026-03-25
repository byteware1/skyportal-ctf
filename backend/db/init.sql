-- SkyPortal Main Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_seed VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Lab categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0
);

-- Labs table
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id INT REFERENCES categories(id),
  difficulty VARCHAR(20) DEFAULT 'Apprentice' CHECK (difficulty IN ('Apprentice', 'Practitioner', 'Expert')),
  description TEXT NOT NULL,
  objectives TEXT[],
  hints TEXT[],
  flag VARCHAR(255) NOT NULL,
  docker_image VARCHAR(255) NOT NULL,
  docker_port INT DEFAULT 3000,
  timeout_minutes INT DEFAULT 30,
  cpu_limit VARCHAR(10) DEFAULT '0.5',
  memory_limit VARCHAR(10) DEFAULT '256m',
  is_active BOOLEAN DEFAULT TRUE,
  prerequisites UUID[],
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active lab containers
CREATE TABLE IF NOT EXISTS active_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  container_id VARCHAR(100) UNIQUE NOT NULL,
  container_name VARCHAR(100),
  host_port INT UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'stopping', 'stopped')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, lab_id)
);

-- User lab completions
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 1,
  time_taken_seconds INT,
  hints_used INT DEFAULT 0,
  UNIQUE(user_id, lab_id)
);

-- Flag submission attempts (audit log)
CREATE TABLE IF NOT EXISTS flag_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  submitted_flag VARCHAR(500) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
  ('SQL Injection', 'sql-injection', 'Exploit database query vulnerabilities to extract, modify, or delete data', 'database', '#ef4444', 1),
  ('Cross-Site Scripting', 'xss', 'Inject malicious scripts into web pages viewed by other users', 'code', '#f97316', 2),
  ('Authentication Flaws', 'authentication', 'Bypass, break, or exploit authentication mechanisms', 'shield-off', '#eab308', 3),
  ('Access Control', 'access-control', 'Escalate privileges and access unauthorized resources', 'lock-open', '#22c55e', 4),
  ('Cryptography', 'cryptography', 'Break weak encryption and exploit cryptographic vulnerabilities', 'key', '#3b82f6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed labs
INSERT INTO labs (id, title, slug, category_id, difficulty, description, objectives, hints, flag, docker_image, docker_port, timeout_minutes, sort_order)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'SQL Injection: WHERE clause bypass',
    'sqli-where-bypass',
    1,
    'Apprentice',
    'This lab contains a SQL injection vulnerability in the product category filter. When the application queries products, it constructs a SQL query with unsanitized user input. Your mission is to exploit this to retrieve unreleased products hidden from the public.',
    ARRAY[
      'Understand how the category filter constructs its SQL query',
      'Inject a payload that bypasses the "released = 1" condition',
      'Retrieve the hidden product containing the flag'
    ],
    ARRAY[
      'Try appending a single quote to the category parameter and observe the error',
      'SQL comments can be used to truncate the rest of a query: --',
      'The OR operator can be used to make a condition always true: OR 1=1'
    ],
    'FLAG{sql_injection_success_where_bypass}',
    'skyportal/lab-sqli-01',
    3000,
    30,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'SQL Injection: UNION attack - retrieve data',
    'sqli-union-basic',
    1,
    'Practitioner',
    'This lab contains a SQL injection vulnerability in the product search. The application returns results in the response, allowing you to use UNION-based attacks to extract data from other database tables. Find the hidden credentials table.',
    ARRAY[
      'Determine the number of columns in the original query',
      'Find columns with text-compatible data types',
      'Use UNION SELECT to retrieve data from the users table'
    ],
    ARRAY[
      'Use ORDER BY to determine column count: ORDER BY 1--, ORDER BY 2--...',
      'NULL values are compatible with all data types in UNION attacks',
      'Try: UNION SELECT NULL,NULL,NULL-- and adjust column count'
    ],
    'FLAG{union_attack_data_exfiltration}',
    'skyportal/lab-sqli-01',
    3000,
    45,
    2
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Reflected XSS: Basic script injection',
    'xss-reflected-basic',
    2,
    'Apprentice',
    'This lab contains a reflected XSS vulnerability in the search functionality. User input is reflected in the response without sanitization. Inject a script that calls alert() to demonstrate the vulnerability.',
    ARRAY[
      'Find the parameter reflected in the page source',
      'Craft a payload that breaks out of the HTML context',
      'Execute JavaScript in the victim''s browser'
    ],
    ARRAY[
      'Check the page source to see how your input is reflected',
      'Try: <script>alert(1)</script>',
      'If filtered, try alternative vectors like event handlers'
    ],
    'FLAG{reflected_xss_alert_executed}',
    'skyportal/lab-xss-01',
    3000,
    20,
    1
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Authentication: Username enumeration',
    'auth-username-enum',
    3,
    'Apprentice',
    'This lab is vulnerable to username enumeration via subtly different responses. The application gives different error messages for invalid usernames vs valid usernames with wrong passwords. Use this to enumerate valid usernames.',
    ARRAY[
      'Observe the difference in responses for valid vs invalid usernames',
      'Enumerate usernames from the provided wordlist',
      'Brute-force the password for the discovered username'
    ],
    ARRAY[
      'Compare the response body carefully for subtle differences',
      'Look at response length as well as content',
      'Common usernames: admin, administrator, user, test'
    ],
    'FLAG{username_enumeration_bypass}',
    'skyportal/lab-auth-01',
    3000,
    30,
    1
  )
ON CONFLICT (slug) DO NOTHING;

-- Create admin user (password: Admin@SkyPortal2024)
INSERT INTO users (username, email, password_hash, role, avatar_seed) VALUES
  ('admin', 'admin@skyportal.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAoXnx2U8vBt2jAe', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;
