const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
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
  const app = createApp();

  it('GET /health returns 200 and a lightweight payload', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.headers['x-powered-by'], undefined);
    assert.deepEqual(Object.keys(response.body).sort(), ['application', 'status', 'timestamp', 'version']);
    assert.equal(response.body.status, 'healthy');
    assert.equal(response.body.application, expectedName);
    assert.equal(response.body.version, expectedVersion);
    assert.equal(Number.isNaN(Date.parse(response.body.timestamp)), false);
  });

  it('GET /version returns the configured version', async () => {
    const response = await request(app).get('/version');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      application: expectedName,
      version: expectedVersion,
      environment: expectedEnvironment,
    });
  });

  it('GET /info returns runtime details', async () => {
    const response = await request(app).get('/info');

    assert.equal(response.status, 200);
    assert.equal(response.body.application, expectedName);
    assert.equal(response.body.version, expectedVersion);
    assert.equal(response.body.environment, expectedEnvironment);
    assert.equal(typeof response.body.hostname, 'string');
    assert.ok(response.body.hostname.length > 0);
    assert.equal(response.body.nodeVersion, process.version);
    assert.equal(response.body.platform, process.platform);
    assert.equal(typeof response.body.uptime, 'number');
  });

  it('GET / returns the dashboard', async () => {
    const response = await request(app).get('/').set('Accept', 'text/html');

    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.match(response.text, /DevOps Kubernetes Demo/);
    assert.match(response.text, /Local CI\/CD &amp; Kubernetes Demonstration/);
  });

  it('GET / with Accept application/json returns service info', async () => {
    const response = await request(app).get('/').set('Accept', 'application/json');

    assert.equal(response.status, 200);
    assert.equal(response.body.service, expectedName);
    assert.equal(response.body.version, expectedVersion);
    assert.equal(response.body.environment, expectedEnvironment);
    assert.ok(Array.isArray(response.body.endpoints));
  });

  it('GET /api/products returns the catalog', async () => {
    const response = await request(app).get('/api/products');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.products));
    assert.ok(response.body.products.length > 0);
    assert.equal(typeof response.body.products[0].id, 'string');
    assert.equal(typeof response.body.products[0].name, 'string');
  });

  it('GET /api/products/:id returns a product', async () => {
    const response = await request(app).get('/api/products/creditos');

    assert.equal(response.status, 200);
    assert.equal(response.body.id, 'creditos');
    assert.equal(response.body.name, 'Créditos');
  });

  it('GET /api/products/:id returns 404 for unknown product', async () => {
    const response = await request(app).get('/api/products/unknown');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { error: 'Product not found' });
  });

  it('GET /cpu generates a bounded load', async () => {
    const response = await request(app).get('/cpu').query({ duration: 50 });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'CPU load generated');
    assert.equal(response.body.duration, 50);
    assert.equal(typeof response.body.hostname, 'string');
  });

  it('GET /cpu rejects an invalid duration', async () => {
    const response = await request(app).get('/cpu').query({ duration: 'abc' });

    assert.equal(response.status, 400);
    assert.equal(typeof response.body.error, 'string');
  });

  it('limits CPU duration to 2000 ms', () => {
    assert.equal(resolveCpuDuration(undefined).duration, DEFAULT_CPU_DURATION_MS);
    assert.equal(resolveCpuDuration('2500').duration, MAX_CPU_DURATION_MS);
    assert.equal(resolveCpuDuration('0').ok, false);
    assert.equal(resolveCpuDuration('-5').ok, false);
  });

  it('GET /missing returns 404', async () => {
    const response = await request(app).get('/missing');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { error: 'Route not found' });
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
