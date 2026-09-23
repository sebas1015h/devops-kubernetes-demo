const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, shutdownServer } = require('../src/app');
const {
  resolveCpuDuration,
  MAX_CPU_DURATION_MS,
  DEFAULT_CPU_DURATION_MS,
} = require('../src/routes/cpu');

const expectedName = process.env.APP_NAME || 'DevOps Kubernetes Demo';
const expectedVersion = process.env.APP_VERSION || '1.0.0';
const expectedEnvironment = process.env.APP_ENVIRONMENT || 'local';

describe('devops kubernetes demo', { concurrency: 1 }, () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it('GET /health returns 200 and a lightweight payload', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.deepEqual(Object.keys(body).sort(), ['application', 'status', 'timestamp', 'version']);
    assert.equal(body.status, 'healthy');
    assert.equal(body.application, expectedName);
    assert.equal(body.version, expectedVersion);
    assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
  });

  it('GET /version returns the configured version', async () => {
    const response = await fetch(`${baseUrl}/version`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      application: expectedName,
      version: expectedVersion,
      environment: expectedEnvironment,
    });
  });

  it('GET /info returns runtime details', async () => {
    const response = await fetch(`${baseUrl}/info`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.application, expectedName);
    assert.equal(body.version, expectedVersion);
    assert.equal(body.environment, expectedEnvironment);
    assert.equal(typeof body.hostname, 'string');
    assert.ok(body.hostname.length > 0);
    assert.equal(body.nodeVersion, process.version);
    assert.equal(body.platform, process.platform);
    assert.equal(typeof body.uptime, 'number');
  });

  it('GET / returns the dashboard', async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(html, /DevOps Kubernetes Demo/);
    assert.match(html, /Local CI\/CD &amp; Kubernetes Demonstration/);
  });

  it('GET /cpu generates a bounded load', async () => {
    const response = await fetch(`${baseUrl}/cpu?duration=50`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'CPU load generated');
    assert.equal(body.duration, 50);
    assert.equal(typeof body.hostname, 'string');
  });

  it('GET /cpu rejects an invalid duration', async () => {
    const response = await fetch(`${baseUrl}/cpu?duration=abc`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });

  it('limits CPU duration to 2000 ms', () => {
    assert.equal(resolveCpuDuration(undefined).duration, DEFAULT_CPU_DURATION_MS);
    assert.equal(resolveCpuDuration('2500').duration, MAX_CPU_DURATION_MS);
    assert.equal(resolveCpuDuration('0').ok, false);
    assert.equal(resolveCpuDuration('-5').ok, false);
  });

  it('GET /missing returns 404', async () => {
    const response = await fetch(`${baseUrl}/missing`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: 'Route not found' });
  });
});

describe('graceful shutdown', () => {
  it('closes the HTTP server after the shutdown signal', async () => {
    const app = createApp();
    const server = await new Promise((resolve) => {
      const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
    });

    const exitCode = await new Promise((resolve) => {
      shutdownServer(server, 'SIGTERM', resolve);
    });

    assert.equal(exitCode, 0);
  });
});
