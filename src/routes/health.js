const express = require('express');
const { getConfig } = require('../utils/systemInfo');

const router = express.Router();

router.get('/', (req, res) => {
  const { application, version } = getConfig();
  res.status(200).json({
    status: 'healthy',
    application,
    version,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
