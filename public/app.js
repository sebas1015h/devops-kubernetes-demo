const REFRESH_MS = 3000;

const fields = {
  application: document.getElementById('application'),
  version: document.getElementById('version'),
  versionBadge: document.getElementById('version-badge'),
  environment: document.getElementById('environment'),
  status: document.getElementById('status'),
  hostname: document.getElementById('hostname'),
  uptime: document.getElementById('uptime'),
  nodeVersion: document.getElementById('node-version'),
  timestamp: document.getElementById('timestamp'),
  statusPill: document.getElementById('status-pill'),
  statusLabel: document.getElementById('status-label'),
  refreshNote: document.getElementById('refresh-note'),
};

function formatVersion(version) {
  if (!version) {
    return '—';
  }
  return version.startsWith('v') ? version : `v${version}`;
}

function formatUptime(seconds) {
  const value = Number.isFinite(seconds) ? seconds : 0;
  return `${value} seconds`;
}

function formatTimestamp(isoTimestamp) {
  if (!isoTimestamp) {
    return '—';
  }
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return parsed.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function setStatus(isHealthy) {
  fields.statusPill.classList.remove('healthy', 'unhealthy');
  fields.statusPill.classList.add(isHealthy ? 'healthy' : 'unhealthy');
  fields.statusLabel.textContent = isHealthy ? 'Healthy' : 'Unhealthy';
  fields.status.textContent = isHealthy ? 'Healthy' : 'Unhealthy';
}

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function refresh() {
  try {
    const [infoResponse, healthResponse] = await Promise.all([
      fetch('/info', { cache: 'no-store' }),
      fetch('/health', { cache: 'no-store' }),
    ]);

    const info = await readJson(infoResponse);
    const health = await readJson(healthResponse);
    const version = formatVersion(info.version);
    const isHealthy = health.status === 'healthy';

    fields.application.textContent = info.application || '—';
    fields.version.textContent = version;
    fields.versionBadge.textContent = version;
    fields.environment.textContent = info.environment || '—';
    fields.hostname.textContent = info.hostname || '—';
    fields.uptime.textContent = formatUptime(info.uptime);
    fields.nodeVersion.textContent = info.nodeVersion || '—';
    fields.timestamp.textContent = formatTimestamp(health.timestamp);
    setStatus(isHealthy);
    fields.refreshNote.textContent = 'Live data from /health and /info';
  } catch (error) {
    setStatus(false);
    fields.refreshNote.textContent = 'Unable to refresh application status';
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
