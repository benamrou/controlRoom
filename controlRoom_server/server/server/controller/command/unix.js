/**
 * Unix Command Execution API
 * 
 * Supports both preset (whitelisted) commands and custom commands.
 * 
 * @class Execute
 * @author Ahmed Benamrouche
 * Date: November 2025
 */

"use strict";

module.exports = function (app, SQL) {
  const { v4: uuidv4 } = require("uuid");
  const { spawn } = require("child_process");
  const logger = require("../../utils/logger.js");

  // In-memory session storage
  const sessions = new Map();

  // Session cleanup interval (clean up old sessions every 10 minutes)
  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  const SESSION_TTL = 5 * 60 * 1000; // 5 minutes after process ends

  // Periodic cleanup of old sessions
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (session.endTime && (now - session.endTime) > SESSION_TTL) {
        sessions.delete(id);
        logger.log('batch', `Cleaned up expired session: ${id}`, 'batch', 1);
      }
    }
  }, CLEANUP_INTERVAL);

  /**
   * Broadcast message to all SSE clients for a session
   * Also buffers messages for late-connecting clients
   */
  function broadcast(sessionId, payload) {
    const session = sessions.get(sessionId);
    if (!session) return;

    // FIX: Buffer all messages so late-connecting clients can receive them
    if (!session.buffer) session.buffer = [];
    session.buffer.push(payload);

    // Send to connected clients
    if (session.clients && session.clients.length > 0) {
      const data = `data: ${JSON.stringify(payload)}\n\n`;
      session.clients.forEach(client => {
        try {
          client.write(data);
        } catch (e) {
          logger.log('batch', `Error broadcasting to client: ${e.message}`, 'batch', 3);
        }
      });
    }
  }

  // ============================================
  // ROUTE: POST /api/exec - Execute a command
  // ============================================
  app.post('/api/exec', (req, res) => {
    try {
      const command = req.body || {};
      
      logger.log('batch', `Exec request body: ${JSON.stringify(req.body)}`, 'batch', 2);
      
      if (!command || !command.cmd) {
        logger.log('batch', 'Exec request missing command', 'batch', 2);
        return res.status(400).json({ error: 'command required' });
      }

      const sessionId = uuidv4();
      logger.log('batch', `Starting session ${sessionId} for command: ${command.cmd}`, 'batch', 1);

      logger.log('batch', `Running custom command via shell: ${command.cmd}`, 'batch', 2);
      const child = spawn(command.cmd, [], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      // Store session with buffer for late-connecting clients
      sessions.set(sessionId, {
        child,
        clients: [],
        buffer: [],  // FIX: Buffer to store output for late clients
        command: command.cmd,
        startTime: Date.now(),
        endTime: null
      });

      // Handle stdout
      child.stdout.on('data', (data) => {
        broadcast(sessionId, { type: 'stdout', data: data.toString() });
      });

      // Handle stderr
      child.stderr.on('data', (data) => {
        broadcast(sessionId, { type: 'stderr', data: data.toString() });
      });

      // Handle process errors (e.g., command not found)
      child.on('error', (err) => {
        logger.log('batch', `Process error for session ${sessionId}: ${err.message}`, 'batch', 3);
        broadcast(sessionId, { type: 'error', data: err.message });
        const session = sessions.get(sessionId);
        if (session) session.endTime = Date.now();
      });

      // Handle process exit
      child.on('close', (code) => {
        logger.log('batch', `Session ${sessionId} finished with exit code: ${code}`, 'batch', 1);
        broadcast(sessionId, { type: 'end', exitCode: code });
        const session = sessions.get(sessionId);
        if (session) session.endTime = Date.now();
      });

      res.json({ sessionId });

    } catch (err) {
      logger.log('batch', `Error in /api/exec: ${err.message}`, 'batch', 3);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================
  // ROUTE: GET /api/stream/:id - SSE log stream
  // ============================================
  app.get('/api/stream/:id', (req, res) => {
    const sessionId = req.params.id;
    const session = sessions.get(sessionId);

    if (!session) {
      logger.log('batch', `Stream request for unknown session: ${sessionId}`, 'batch', 2);
      return res.status(404).json({ error: 'session not found' });
    }

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'  // Disable nginx buffering
    });

    // Send initial newline
    res.write('\n');

    // FIX: Send buffered messages to this late-connecting client
    if (session.buffer && session.buffer.length > 0) {
      logger.log('batch', `Sending ${session.buffer.length} buffered messages to client`, 'batch', 1);
      session.buffer.forEach(payload => {
        try {
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (e) {
          logger.log('batch', `Error sending buffered message: ${e.message}`, 'batch', 3);
        }
      });
    }

    // Add this client to the session's client list for future messages
    session.clients.push(res);
    logger.log('batch', `Client connected to stream for session: ${sessionId}`, 'batch', 1);

    // Handle client disconnect
    req.on('close', () => {
      const idx = session.clients.indexOf(res);
      if (idx >= 0) {
        session.clients.splice(idx, 1);
      }
      logger.log('batch', `Client disconnected from session: ${sessionId}`, 'batch', 1);
    });
  });

  // ============================================
  // ROUTE: POST /api/cancel/:id - Cancel execution
  // ============================================
  app.post('/api/cancel/:id', (req, res) => {
    const sessionId = req.params.id;
    const session = sessions.get(sessionId);

    if (!session) {
      logger.log('batch', `Cancel request for unknown session: ${sessionId}`, 'batch', 2);
      return res.status(404).json({ error: 'session not found' });
    }

    try {
      // Send SIGTERM first (graceful)
      session.child.kill('SIGTERM');
      
      // If still running after 5 seconds, force kill
      setTimeout(() => {
        try {
          if (!session.child.killed) {
            session.child.kill('SIGKILL');
            logger.log('batch', `Force killed session: ${sessionId}`, 'batch', 2);
          }
        } catch (e) {
          // Process already dead
        }
      }, 5000);

      logger.log('batch', `Cancel requested for session: ${sessionId}`, 'batch', 1);
      res.json({ success: true });

    } catch (err) {
      logger.log('batch', `Error cancelling session ${sessionId}: ${err.message}`, 'batch', 3);
      res.status(500).json({ error: 'failed to cancel' });
    }
  });

  return {
    getSessions: () => sessions
  };
};