/**
 * start-python-api.js
 * 
 * Starts the product-bg-removal FastAPI service automatically.
 * - Creates venv if it doesn't exist
 * - Installs dependencies into the venv once
 * - Starts uvicorn on port 8000
 * 
 * Run via: node scripts/start-python-api.js
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_DIR = path.resolve(__dirname, '..', 'product-bg-removal');
const VENV_DIR = path.join(API_DIR, 'venv');
const PORT = 8000;

// Determine OS-specific paths
const isWindows = process.platform === 'win32';
const pythonCmd = isWindows ? 'python' : 'python3';
const pipPath = isWindows
    ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
    : path.join(VENV_DIR, 'bin', 'pip');
const uvicornPath = isWindows
    ? path.join(VENV_DIR, 'Scripts', 'uvicorn.exe')
    : path.join(VENV_DIR, 'bin', 'uvicorn');

function log(msg) {
    console.log(`\x1b[35m[bg-api]\x1b[0m ${msg}`);
}

function logError(msg) {
    console.error(`\x1b[31m[bg-api ERROR]\x1b[0m ${msg}`);
}

async function setup() {
    // 1. Create virtualenv if missing
    if (!fs.existsSync(VENV_DIR)) {
        log('Creating Python virtual environment...');
        execSync(`${pythonCmd} -m venv venv`, { cwd: API_DIR, stdio: 'inherit' });
        log('Virtual environment created.');
    } else {
        log('Virtual environment already exists, skipping creation.');
    }

    // 2. Install requirements only if uvicorn is missing (first-time setup)
    if (!fs.existsSync(uvicornPath)) {
        log('Installing Python dependencies (one-time setup)...');
        execSync(`"${pipPath}" install -r requirements.txt --quiet`, {
            cwd: API_DIR,
            stdio: 'inherit',
        });
        log('Dependencies installed successfully.');
    } else {
        log('Dependencies already installed, skipping pip install.');
    }
}

async function startServer() {
    log(`Starting FastAPI server on http://localhost:${PORT} ...`);

    const server = spawn(uvicornPath, ['main:app', '--host', '0.0.0.0', '--port', String(PORT), '--reload'], {
        cwd: API_DIR,
        stdio: 'inherit',
        shell: false,
    });

    server.on('error', (err) => {
        logError(`Failed to start uvicorn: ${err.message}`);
        process.exit(1);
    });

    server.on('close', (code) => {
        if (code !== 0) {
            logError(`uvicorn exited with code ${code}`);
            process.exit(code);
        }
    });

    // Forward SIGINT/SIGTERM to the child process for clean shutdown
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, () => {
            log('Shutting down FastAPI server...');
            server.kill(signal);
        });
    });
}

(async () => {
    try {
        await setup();
        await startServer();
    } catch (err) {
        logError(err.message);
        process.exit(1);
    }
})();
