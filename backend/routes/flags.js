const express = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const flagLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many flag attempts. Slow down.' }
});

// Submit a flag
router.post('/submit', authenticate, flagLimiter, async (req, res) => {
  try {
    const { labSlug, flag } = req.body;

    if (!labSlug || !flag) {
      return res.status(400).json({ error: 'Lab slug and flag are required' });
    }

    const labResult = await db.query(
      'SELECT id, flag, title FROM labs WHERE slug = $1 AND is_active = true',
      [labSlug]
    );

    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];
    const isCorrect = flag.trim() === lab.flag.trim();

    // Log attempt
    await db.query(
      `INSERT INTO flag_attempts (user_id, lab_id, submitted_flag, is_correct) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, lab.id, flag.trim(), isCorrect]
    );

    if (!isCorrect) {
      return res.json({ 
        correct: false, 
        message: 'Incorrect flag. Keep trying!' 
      });
    }

    // Check if already completed
    const alreadyCompleted = await db.query(
      `SELECT id FROM completions WHERE user_id = $1 AND lab_id = $2`,
      [req.user.id, lab.id]
    );

    if (alreadyCompleted.rows.length > 0) {
      return res.json({ 
        correct: true, 
        alreadyCompleted: true,
        message: 'Correct! You already completed this lab.' 
      });
    }

    // Get hints used count
    const hintsUsed = await db.query(
      `SELECT COALESCE(hints_used, 0) as hints_used FROM completions 
       WHERE user_id = $1 AND lab_id = $2`,
      [req.user.id, lab.id]
    );

    // Record completion
    await db.query(
      `INSERT INTO completions (user_id, lab_id, hints_used) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, lab_id) 
       DO UPDATE SET completed_at = NOW()`,
      [req.user.id, lab.id, hintsUsed.rows[0]?.hints_used || 0]
    );

    // Get updated stats
    const statsResult = await db.query(
      `SELECT COUNT(*)::int as total_completions FROM completions WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      correct: true,
      alreadyCompleted: false,
      message: `🎉 Congratulations! You solved "${lab.title}"!`,
      totalCompletions: statsResult.rows[0].total_completions
    });
  } catch (err) {
    console.error('Flag submit error:', err);
    res.status(500).json({ error: 'Flag submission failed' });
  }
});

module.exports = router;
