const express = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { startContainer, stopContainer } = require('../services/containerManager');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const startLabLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: 'Too many lab starts. Please wait a few minutes.' }
});

// Start a lab container
router.post('/start/:labSlug', authenticate, startLabLimiter, async (req, res) => {
  try {
    const labResult = await db.query(
      `SELECT id, docker_image, docker_port, timeout_minutes, cpu_limit, memory_limit, title
       FROM labs WHERE slug = $1 AND is_active = true`,
      [req.params.labSlug]
    );

    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];

    // Check if user already has 3 active containers
    const activeCount = await db.query(
      `SELECT COUNT(*) FROM active_containers 
       WHERE user_id = $1 AND status IN ('starting', 'running')`,
      [req.user.id]
    );

    if (parseInt(activeCount.rows[0].count) >= 3) {
      return res.status(429).json({ 
        error: 'You have too many active lab sessions. Please stop existing labs first.' 
      });
    }

    const result = await startContainer(req.user.id, lab);

    res.json({
      message: 'Lab started successfully',
      url: result.url,
      port: result.port,
      expiresAt: result.expiresAt,
      status: result.status,
      labTitle: lab.title
    });
  } catch (err) {
    console.error('Start container error:', err);
    res.status(500).json({ error: err.message || 'Failed to start lab' });
  }
});

// Stop a lab container
router.post('/stop/:labSlug', authenticate, async (req, res) => {
  try {
    const labResult = await db.query(
      'SELECT id FROM labs WHERE slug = $1',
      [req.params.labSlug]
    );

    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const result = await stopContainer(req.user.id, labResult.rows[0].id);
    res.json(result);
  } catch (err) {
    console.error('Stop container error:', err);
    res.status(500).json({ error: 'Failed to stop lab' });
  }
});

// Get status of user's active containers
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ac.host_port, ac.status, ac.started_at, ac.expires_at, ac.container_name,
              l.title as lab_title, l.slug as lab_slug
       FROM active_containers ac
       JOIN labs l ON l.id = ac.lab_id
       WHERE ac.user_id = $1 AND ac.status IN ('starting', 'running')
       ORDER BY ac.started_at DESC`,
      [req.user.id]
    );

    const labHost = process.env.LAB_HOST || 'localhost';
    
    res.json(result.rows.map(r => ({
      labTitle: r.lab_title,
      labSlug: r.lab_slug,
      url: `http://${labHost}:${r.host_port}`,
      port: r.host_port,
      status: r.status,
      startedAt: r.started_at,
      expiresAt: r.expires_at
    })));
  } catch (err) {
    console.error('Get containers error:', err);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

module.exports = router;
