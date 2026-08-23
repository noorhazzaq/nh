// /api/heal.js
const fs = require('fs');
const path = require('path');

// ============================================================
//  HEALING ENGINE BACKEND
//  Has file write access to rewrite index.html
// ============================================================

// Version tracking
let version = 1;

// Patch patterns – detect and fix common issues
const patches = [
  {
    id: 'fix-polling-interval',
    pattern: /setInterval\(pollNewMessages,\s*(\d+)\)/,
    fix: (match) => {
      const current = parseInt(match[1]);
      const newInterval = Math.min(current + 1000, 15000);
      return `setInterval(pollNewMessages, ${newInterval})`;
    },
    description: 'Increased polling interval to reduce network load'
  },
  {
    id: 'fix-timeout',
    pattern: /FETCH_TIMEOUT\s*=\s*(\d+)/,
    fix: (match) => {
      const current = parseInt(match[1]);
      const newTimeout = Math.min(current + 5000, 60000);
      return `FETCH_TIMEOUT = ${newTimeout}`;
    },
    description: 'Increased fetch timeout for slow connections'
  },
  {
    id: 'fix-error-handling',
    pattern: /catch\s*\(\s*\)\s*\{\s*\}/,
    fix: () => {
      return `catch(error) { 
        console.warn('Healing: caught error', error);
        if (window.requestBackendHeal) {
          window.requestBackendHeal({ message: error.message, type: 'caught' });
        }
      }`;
    },
    description: 'Added error logging to empty catch blocks'
  },
  {
    id: 'fix-null-checks',
    pattern: /data\.(\w+)/g,
    fix: (match, group) => {
      return `(data?.${group} || {})`;
    },
    description: 'Added null safety to data access'
  },
  {
    id: 'fix-retry-logic',
    pattern: /maxAttempts\s*=\s*(\d+)/,
    fix: (match) => {
      const current = parseInt(match[1]);
      return `maxAttempts = ${current + 2}`;
    },
    description: 'Increased retry attempts for network resilience'
  }
];

// ============================================================
//  MAIN HANDLER
// ============================================================

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET – Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      version: version,
      status: 'online',
      patches_applied: fs.existsSync(path.join(process.cwd(), 'healing', 'patches.log')) 
        ? fs.readFileSync(path.join(process.cwd(), 'healing', 'patches.log'), 'utf8').split('\n').filter(Boolean).length 
        : 0
    });
  }

  // POST – Heal the code
  if (req.method === 'POST') {
    try {
      const errorData = req.body;
      const indexHtmlPath = path.join(process.cwd(), 'index.html');
      const healingDir = path.join(process.cwd(), 'healing');
      const backupDir = path.join(healingDir, 'backup');
      const logPath = path.join(healingDir, 'patches.log');

      // Create directories if they don't exist
      if (!fs.existsSync(healingDir)) fs.mkdirSync(healingDir, { recursive: true });
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

      // Read current index.html
      let code = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // Create backup
      const timestamp = Date.now();
      const backupName = `index.html.backup-${timestamp}`;
      fs.writeFileSync(path.join(backupDir, backupName), code);

      // Find and apply patches
      let appliedPatches = [];
      let modifiedCode = code;

      for (const patch of patches) {
        const match = modifiedCode.match(patch.pattern);
        if (match) {
          const fixed = patch.fix(...match);
          modifiedCode = modifiedCode.replace(patch.pattern, fixed);
          appliedPatches.push({
            id: patch.id,
            description: patch.description,
            original: match[0],
            fixed: fixed
          });
          
          // Log the fix
          const logEntry = `[${new Date().toISOString()}] Applied: ${patch.id} - ${patch.description}\n`;
          fs.appendFileSync(logPath, logEntry);
        }
      }

      // If patches were applied, write the new file
      if (appliedPatches.length > 0) {
        fs.writeFileSync(indexHtmlPath, modifiedCode);
        version++;

        return res.status(200).json({
          success: true,
          version: version,
          patches_applied: appliedPatches.length,
          patches: appliedPatches,
          backup: backupName,
          restart_required: true,
          message: `Applied ${appliedPatches.length} patches to index.html`
        });
      } else {
        // No patches needed
        return res.status(200).json({
          success: true,
          version: version,
          patches_applied: 0,
          message: 'No patches needed, code is healthy',
          error_analyzed: errorData.message || 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Healing engine error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ success: false, error: 'Method not allowed' });
};