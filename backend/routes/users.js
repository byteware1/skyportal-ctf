const express = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user progress/stats
router.get('/progress', authenticate, async (req, res) => {
  try {
    const [totalLabs, completions, categories] = await Promise.all([
      db.query('SELECT COUNT(*)::int as count FROM labs WHERE is_active = true'),
      db.query(
        `SELECT c.id, c.completed_at, c.hints_used, 
                l.title, l.slug, l.difficulty, 
                cat.name as category_name, cat.slug as category_slug, cat.color as category_color
         FROM completions c
         JOIN labs l ON l.id = c.lab_id
         JOIN categories cat ON cat.id = l.category_id
         WHERE c.user_id = $1 AND c.completed_at IS NOT NULL
         ORDER BY c.completed_at DESC`,
        [req.user.id]
      ),
      db.query(
        `SELECT cat.id, cat.name, cat.slug, cat.color, cat.icon,
                COUNT(l.id)::int as total_labs,
                COUNT(comp.id)::int as completed_labs
         FROM categories cat
         JOIN labs l ON l.category_id = cat.id AND l.is_active = true
         LEFT JOIN completions comp ON comp.lab_id = l.id AND comp.user_id = $1 AND comp.completed_at IS NOT NULL
         GROUP BY cat.id
         ORDER BY cat.sort_order`,
        [req.user.id]
      )
    ]);

    res.json({
      totalLabs: totalLabs.rows[0].count,
      completedLabs: completions.rows.length,
      completionPercentage: totalLabs.rows[0].count > 0
        ? Math.round((completions.rows.length / totalLabs.rows[0].count) * 100)
        : 0,
      recentCompletions: completions.rows.slice(0, 5),
      allCompletions: completions.rows,
      categories: categories.rows
    });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.username, u.avatar_seed,
              COUNT(c.id)::int as completed_labs,
              MIN(c.completed_at) as first_completion,
              MAX(c.completed_at) as last_completion
       FROM users u
       LEFT JOIN completions c ON c.user_id = u.id AND c.completed_at IS NOT NULL
       WHERE u.role = 'user'
       GROUP BY u.id
       HAVING COUNT(c.id) > 0
       ORDER BY completed_labs DESC, last_completion ASC
       LIMIT 20`
    );

    res.json(result.rows.map((r, i) => ({
      rank: i + 1,
      username: r.username,
      avatarSeed: r.avatar_seed,
      completedLabs: r.completed_labs,
      lastCompletion: r.last_completion
    })));
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
