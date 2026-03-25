const express = require('express');
const db = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getAllContainers, cleanupExpiredContainers } = require('../services/containerManager');

const router = express.Router();

router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [users, labs, containers, completions, recentAttempts] = await Promise.all([
      db.query('SELECT COUNT(*)::int as count FROM users WHERE role = $1', ['user']),
      db.query('SELECT COUNT(*)::int as count FROM labs WHERE is_active = true'),
      db.query(`SELECT COUNT(*)::int as count FROM active_containers WHERE status IN ('starting', 'running')`),
      db.query('SELECT COUNT(*)::int as count FROM completions WHERE completed_at IS NOT NULL'),
      db.query(
        `SELECT fa.submitted_flag, fa.is_correct, fa.attempted_at,
                u.username, l.title as lab_title
         FROM flag_attempts fa
         JOIN users u ON u.id = fa.user_id
         JOIN labs l ON l.id = fa.lab_id
         ORDER BY fa.attempted_at DESC
         LIMIT 20`
      )
    ]);

    res.json({
      totalUsers: users.rows[0].count,
      totalLabs: labs.rows[0].count,
      activeContainers: containers.rows[0].count,
      totalCompletions: completions.rows[0].count,
      recentAttempts: recentAttempts.rows
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all containers
router.get('/containers', async (req, res) => {
  try {
    const containers = await getAllContainers();
    const labHost = process.env.LAB_HOST || 'localhost';
    res.json(containers.map(c => ({
      ...c,
      url: `http://${labHost}:${c.host_port}`
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// Force cleanup expired containers
router.post('/containers/cleanup', async (req, res) => {
  try {
    const count = await cleanupExpiredContainers();
    res.json({ message: `Cleaned up ${count} containers` });
  } catch (err) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, u.last_login,
              COUNT(c.id)::int as completed_labs
       FROM users u
       LEFT JOIN completions c ON c.user_id = u.id AND c.completed_at IS NOT NULL
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all labs (including inactive)
router.get('/labs', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, c.name as category_name, COUNT(comp.id)::int as completion_count
       FROM labs l
       JOIN categories c ON c.id = l.category_id
       LEFT JOIN completions comp ON comp.lab_id = l.id AND comp.completed_at IS NOT NULL
       GROUP BY l.id, c.name
       ORDER BY c.sort_order, l.sort_order`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Create lab
router.post('/labs', async (req, res) => {
  try {
    const { 
      title, slug, categoryId, difficulty, description, objectives, 
      hints, flag, dockerImage, dockerPort, timeoutMinutes, sortOrder 
    } = req.body;

    const result = await db.query(
      `INSERT INTO labs (title, slug, category_id, difficulty, description, objectives, hints, flag, docker_image, docker_port, timeout_minutes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, slug, categoryId, difficulty, description, objectives, hints, flag, dockerImage, dockerPort || 3000, timeoutMinutes || 30, sortOrder || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create lab error:', err);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});

// Toggle lab active status
router.patch('/labs/:id/toggle', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE labs SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle lab' });
  }
});

module.exports = router;
