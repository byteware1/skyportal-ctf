const express = require('express');
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all labs with completion status for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        l.id, l.title, l.slug, l.difficulty, l.description, l.objectives,
        l.timeout_minutes, l.sort_order,
        c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
        comp.id IS NOT NULL as is_completed,
        comp.completed_at,
        comp.hints_used,
        ac.id IS NOT NULL as has_active_container,
        ac.expires_at as container_expires_at,
        ac.host_port as container_port,
        ac.status as container_status
       FROM labs l
       JOIN categories c ON c.id = l.category_id
       LEFT JOIN completions comp ON comp.lab_id = l.id AND comp.user_id = $1
       LEFT JOIN active_containers ac ON ac.lab_id = l.id AND ac.user_id = $1 AND ac.status IN ('starting', 'running')
       WHERE l.is_active = true
       ORDER BY c.sort_order, l.sort_order`,
      [req.user.id]
    );

    // Group by category
    const categorized = {};
    result.rows.forEach(lab => {
      const cat = lab.category_slug;
      if (!categorized[cat]) {
        categorized[cat] = {
          name: lab.category_name,
          slug: lab.category_slug,
          icon: lab.category_icon,
          color: lab.category_color,
          labs: []
        };
      }
      categorized[cat].labs.push({
        id: lab.id,
        title: lab.title,
        slug: lab.slug,
        difficulty: lab.difficulty,
        description: lab.description,
        objectives: lab.objectives,
        timeoutMinutes: lab.timeout_minutes,
        isCompleted: lab.is_completed,
        completedAt: lab.completed_at,
        hintsUsed: lab.hints_used,
        hasActiveContainer: lab.has_active_container,
        containerExpiresAt: lab.container_expires_at,
        containerPort: lab.container_port,
        containerStatus: lab.container_status
      });
    });

    res.json(Object.values(categorized));
  } catch (err) {
    console.error('Get labs error:', err);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

// Get single lab
router.get('/:slug', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        l.*, 
        c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
        comp.id IS NOT NULL as is_completed,
        comp.completed_at,
        ac.id IS NOT NULL as has_active_container,
        ac.expires_at as container_expires_at,
        ac.host_port as container_port,
        ac.container_id,
        ac.status as container_status
       FROM labs l
       JOIN categories c ON c.id = l.category_id
       LEFT JOIN completions comp ON comp.lab_id = l.id AND comp.user_id = $1
       LEFT JOIN active_containers ac ON ac.lab_id = l.id AND ac.user_id = $1 AND ac.status IN ('starting', 'running')
       WHERE l.slug = $2 AND l.is_active = true`,
      [req.user.id, req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = result.rows[0];
    
    // Only show hints if not completed
    const hints = lab.is_completed ? lab.hints : lab.hints?.map(() => null);

    res.json({
      id: lab.id,
      title: lab.title,
      slug: lab.slug,
      difficulty: lab.difficulty,
      description: lab.description,
      objectives: lab.objectives,
      hints: lab.hints,
      timeoutMinutes: lab.timeout_minutes,
      category: {
        name: lab.category_name,
        slug: lab.category_slug,
        icon: lab.category_icon,
        color: lab.category_color
      },
      isCompleted: lab.is_completed,
      completedAt: lab.completed_at,
      hasActiveContainer: lab.has_active_container,
      containerExpiresAt: lab.container_expires_at,
      containerPort: lab.container_port,
      containerStatus: lab.container_status
    });
  } catch (err) {
    console.error('Get lab error:', err);
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

// Get hint for a lab (increments hint counter)
router.post('/:slug/hint/:index', authenticate, async (req, res) => {
  try {
    const hintIndex = parseInt(req.params.index);
    
    const labResult = await db.query(
      'SELECT id, hints FROM labs WHERE slug = $1 AND is_active = true',
      [req.params.slug]
    );
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    
    const lab = labResult.rows[0];
    
    if (!lab.hints || hintIndex >= lab.hints.length) {
      return res.status(400).json({ error: 'Hint index out of range' });
    }

    // Track hint usage in completions if exists
    await db.query(
      `INSERT INTO completions (user_id, lab_id, hints_used, completed_at) 
       VALUES ($1, $2, 1, NULL)
       ON CONFLICT (user_id, lab_id) 
       DO UPDATE SET hints_used = GREATEST(completions.hints_used, $3)
       WHERE completions.completed_at IS NULL`,
      [req.user.id, lab.id, hintIndex + 1]
    );
    
    res.json({ hint: lab.hints[hintIndex] });
  } catch (err) {
    console.error('Get hint error:', err);
    res.status(500).json({ error: 'Failed to get hint' });
  }
});

module.exports = router;
