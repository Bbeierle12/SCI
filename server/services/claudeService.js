const { spawn, execSync } = require('child_process');

let claudeAvailable = null;

// Check if Claude CLI is available
function checkClaudeAvailable() {
  if (claudeAvailable !== null) return claudeAvailable;
  try {
    execSync('claude --version', { stdio: 'pipe' });
    claudeAvailable = true;
  } catch {
    claudeAvailable = false;
  }
  return claudeAvailable;
}

// Reset the cached availability check
function resetAvailabilityCheck() {
  claudeAvailable = null;
}

// Execute Claude CLI command
function queryClaudeCLI(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    if (!checkClaudeAvailable()) {
      reject(new Error('Claude CLI is not available'));
      return;
    }

    const args = ['-p', '--output-format', 'text'];

    // Add system prompt if provided
    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }

    // Disable tools for pure text responses (faster)
    if (options.noTools) {
      args.push('--tools', '');
    }

    // Add the prompt
    args.push(prompt);

    const claude = spawn('claude', args, {
      shell: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `Claude CLI exited with code ${code}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      claude.kill();
      reject(new Error('Claude CLI timeout'));
    }, 60000);

    claude.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

module.exports = {
  checkClaudeAvailable,
  resetAvailabilityCheck,
  queryClaudeCLI
};
