const express = require('express');
const { getHostname } = require('../utils/systemInfo');

const DEFAULT_CPU_DURATION_MS = 300;
const MAX_CPU_DURATION_MS = 2000;

const router = express.Router();

function resolveCpuDuration(rawValue) {
  if (rawValue === undefined) {
    return { ok: true, duration: DEFAULT_CPU_DURATION_MS };
  }

  if (typeof rawValue !== 'string' || !/^[1-9]\d*$/.test(rawValue)) {
    return { ok: false };
  }

  const requested = Number.parseInt(rawValue, 10);
  return {
    ok: true,
    duration: Math.min(requested, MAX_CPU_DURATION_MS),
  };
}

function burnCpu(durationMs) {
  const end = Date.now() + durationMs;
  let accumulator = 0;
  while (Date.now() < end) {
    accumulator = (accumulator + Math.sqrt(accumulator + 1)) % 1000;
  }
  return accumulator;
}

router.get('/', (req, res) => {
  const result = resolveCpuDuration(req.query.duration);

  if (!result.ok) {
    res.status(400).json({
      error: 'Invalid duration. Use a positive integer number of milliseconds.',
    });
    return;
  }

  burnCpu(result.duration);

  res.status(200).json({
    message: 'CPU load generated',
    duration: result.duration,
    hostname: getHostname(),
  });
});

module.exports = router;
module.exports.resolveCpuDuration = resolveCpuDuration;
module.exports.MAX_CPU_DURATION_MS = MAX_CPU_DURATION_MS;
module.exports.DEFAULT_CPU_DURATION_MS = DEFAULT_CPU_DURATION_MS;
