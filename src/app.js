const express = require('express');
const path = require('path');
const healthRouter = require('./routes/health');
const versionRouter = require('./routes/version');
const infoRouter = require('./routes/info');
const cpuRouter = require('./routes/cpu');
const productsRouter = require('./routes/products');
const { getConfig, getHostname } = require('./utils/systemInfo');

const SHUTDOWN_TIMEOUT_MS = 10000;

function formatLogTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function requestLogger(req, res, next) {
  const requestPath = req.path;
  res.on('finish', () => {
    console.log(
      `[${formatLogTimestamp()}] ${req.method} ${requestPath} ${res.statusCode} hostname=${getHostname()}`
    );
  });
  next();
}

function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const message = err instanceof Error ? err.message : 'unknown error';
  console.error(
    `[${formatLogTimestamp()}] ERROR ${req.method} ${req.path} hostname=${getHostname()} message=${message}`
  );
  res.status(500).json({ error: 'Internal Server Error' });
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);

  app.get('/', noStore, (req, res, next) => {
    const wantsJson = req.accepts(['html', 'json']) === 'json';
    if (!wantsJson) {
      next();
      return;
    }

    const config = getConfig();
    res.status(200).json({
      service: config.application,
      version: config.version,
      environment: config.environment,
      endpoints: ['/health', '/version', '/info', '/cpu', '/api/products', '/api/products/:id'],
    });
  });

  app.use('/health', noStore, healthRouter);
  app.use('/version', noStore, versionRouter);
  app.use('/info', noStore, infoRouter);
  app.use('/cpu', noStore, cpuRouter);
  app.use('/api/products', noStore, productsRouter);

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function shutdownServer(server, signal, exitProcess = process.exit) {
  console.log(`[${formatLogTimestamp()}] ${signal} received. Starting graceful shutdown.`);

  const forceExitTimer = setTimeout(() => {
    console.error(`[${formatLogTimestamp()}] Forced shutdown after timeout.`);
    exitProcess(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close((error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      console.error(`[${formatLogTimestamp()}] HTTP server close failed.`);
      exitProcess(1);
      return;
    }
    console.log(`[${formatLogTimestamp()}] HTTP server closed.`);
    exitProcess(0);
  });

  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }
}

function startServer() {
  const config = getConfig();
  const app = createApp();

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(
      `[${formatLogTimestamp()}] ${config.application} listening on 0.0.0.0:${config.port} version=${config.version} environment=${config.environment} hostname=${getHostname()}`
    );
  });

  let shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    shutdownServer(server, signal);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
  shutdownServer,
};
