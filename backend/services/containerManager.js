const Docker = require('dockerode');
const db = require('../db/pool');

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

const PORT_MIN = parseInt(process.env.LAB_PORT_MIN) || 10000;
const PORT_MAX = parseInt(process.env.LAB_PORT_MAX) || 11000;
const LAB_HOST = process.env.LAB_HOST || 'localhost';

// Get a free port
async function getFreePort() {
  const usedPorts = await db.query(
    'SELECT host_port FROM active_containers WHERE status IN ($1, $2)',
    ['starting', 'running']
  );
  const used = new Set(usedPorts.rows.map(r => r.host_port));
  
  for (let port = PORT_MIN; port <= PORT_MAX; port++) {
    if (!used.has(port)) return port;
  }
  throw new Error('No available ports for lab containers');
}

// Start a lab container
async function startContainer(userId, lab) {
  // Check if user already has a running container for this lab
  const existing = await db.query(
    `SELECT * FROM active_containers 
     WHERE user_id = $1 AND lab_id = $2 AND status IN ('starting', 'running')`,
    [userId, lab.id]
  );
  
  if (existing.rows.length > 0) {
    const c = existing.rows[0];
    return {
      url: `http://${LAB_HOST}:${c.host_port}`,
      expiresAt: c.expires_at,
      port: c.host_port,
      status: c.status
    };
  }

  const hostPort = await getFreePort();
  const containerName = `skyportal-lab-${userId.slice(0, 8)}-${lab.id.slice(0, 8)}-${Date.now()}`;
  const expiresAt = new Date(Date.now() + (lab.timeout_minutes * 60 * 1000));

  // Create container record first
  const dbRecord = await db.query(
    `INSERT INTO active_containers 
     (user_id, lab_id, container_id, container_name, host_port, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'starting', $6)
     RETURNING id`,
    [userId, lab.id, 'pending', containerName, hostPort, expiresAt]
  );

  try {
    const container = await docker.createContainer({
      Image: lab.docker_image,
      name: containerName,
      ExposedPorts: { [`${lab.docker_port}/tcp`]: {} },
      HostConfig: {
        PortBindings: {
          [`${lab.docker_port}/tcp`]: [{ HostPort: String(hostPort) }]
        },
        // Security: isolation
        NetworkMode: 'bridge',
        ReadonlyRootfs: false,
        CapDrop: ['ALL'],
        CapAdd: ['CHOWN', 'SETUID', 'SETGID', 'DAC_OVERRIDE'],
        SecurityOpt: ['no-new-privileges:true'],
        // Resource limits
        NanoCpus: Math.floor(parseFloat(lab.cpu_limit || '0.5') * 1e9),
        Memory: parseMemoryLimit(lab.memory_limit || '256m'),
        // Auto-remove when stopped
        AutoRemove: true,
        // Network restrictions - no access to host network
        ExtraHosts: [],
      },
      Env: [
        `LAB_ID=${lab.id}`,
        `LAB_TIMEOUT=${lab.timeout_minutes}`,
        `INSTANCE_ID=${containerName}`
      ]
    });

    await container.start();

    // Update with real container ID
    await db.query(
      `UPDATE active_containers SET container_id = $1, status = 'running' WHERE id = $2`,
      [container.id, dbRecord.rows[0].id]
    );

    return {
      url: `http://${LAB_HOST}:${hostPort}`,
      expiresAt,
      port: hostPort,
      status: 'running'
    };
  } catch (err) {
    // Cleanup DB record on failure
    await db.query('DELETE FROM active_containers WHERE id = $1', [dbRecord.rows[0].id]);
    console.error('Container start error:', err);
    throw new Error(`Failed to start lab container: ${err.message}`);
  }
}

// Stop a container
async function stopContainer(userId, labId) {
  const result = await db.query(
    `SELECT * FROM active_containers 
     WHERE user_id = $1 AND lab_id = $2 AND status IN ('starting', 'running')`,
    [userId, labId]
  );

  if (result.rows.length === 0) {
    return { message: 'No active container found' };
  }

  const record = result.rows[0];
  
  await db.query(
    'UPDATE active_containers SET status = $1 WHERE id = $2',
    ['stopping', record.id]
  );

  try {
    if (record.container_id && record.container_id !== 'pending') {
      const container = docker.getContainer(record.container_id);
      await container.stop({ t: 5 });
    }
  } catch (err) {
    console.log('Container already stopped or not found:', err.message);
  }

  await db.query('DELETE FROM active_containers WHERE id = $1', [record.id]);
  
  return { message: 'Container stopped' };
}

// Cleanup expired containers
async function cleanupExpiredContainers() {
  const expired = await db.query(
    `SELECT * FROM active_containers 
     WHERE expires_at < NOW() AND status IN ('starting', 'running')
     LIMIT 20`
  );

  for (const record of expired.rows) {
    try {
      console.log(`Cleaning up expired container: ${record.container_name}`);
      if (record.container_id && record.container_id !== 'pending') {
        const container = docker.getContainer(record.container_id);
        await container.stop({ t: 5 }).catch(() => {});
      }
      await db.query('DELETE FROM active_containers WHERE id = $1', [record.id]);
    } catch (err) {
      console.error(`Failed to cleanup container ${record.container_id}:`, err.message);
      // Force delete DB record anyway
      await db.query('DELETE FROM active_containers WHERE id = $1', [record.id]);
    }
  }

  return expired.rows.length;
}

// Start cleanup daemon
function startContainerCleanup() {
  setInterval(async () => {
    try {
      const count = await cleanupExpiredContainers();
      if (count > 0) {
        console.log(`Cleaned up ${count} expired containers`);
      }
    } catch (err) {
      console.error('Cleanup daemon error:', err);
    }
  }, 60 * 1000); // Every minute
}

// Get all active containers (admin)
async function getAllContainers() {
  const result = await db.query(
    `SELECT ac.*, u.username, l.title as lab_title, l.slug as lab_slug
     FROM active_containers ac
     JOIN users u ON u.id = ac.user_id
     JOIN labs l ON l.id = ac.lab_id
     ORDER BY ac.started_at DESC`
  );
  return result.rows;
}

function parseMemoryLimit(limit) {
  if (limit.endsWith('m')) return parseInt(limit) * 1024 * 1024;
  if (limit.endsWith('g')) return parseInt(limit) * 1024 * 1024 * 1024;
  return parseInt(limit);
}

module.exports = { 
  startContainer, 
  stopContainer, 
  cleanupExpiredContainers, 
  startContainerCleanup,
  getAllContainers 
};
