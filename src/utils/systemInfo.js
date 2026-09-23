const os = require('os');

const DEFAULTS = {
  application: 'DevOps Kubernetes Demo',
  version: '1.0.0',
  environment: 'local',
  port: 3000,
};

function readEnv(name, fallback) {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function getPort() {
  const raw = process.env.PORT;
  if (raw === undefined || String(raw).trim() === '') {
    return DEFAULTS.port;
  }
  const port = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return DEFAULTS.port;
  }
  return port;
}

function getConfig() {
  return {
    application: readEnv('APP_NAME', DEFAULTS.application),
    version: readEnv('APP_VERSION', DEFAULTS.version),
    environment: readEnv('APP_ENVIRONMENT', DEFAULTS.environment),
    port: getPort(),
  };
}

function getHostname() {
  return os.hostname();
}

function getSystemInfo() {
  const config = getConfig();
  return {
    application: config.application,
    version: config.version,
    environment: config.environment,
    hostname: getHostname(),
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
  };
}

module.exports = {
  getConfig,
  getHostname,
  getSystemInfo,
};
