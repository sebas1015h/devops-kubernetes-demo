const express = require('express');
const { getConfig } = require('../utils/systemInfo');

const router = express.Router();

router.get('/', (req, res) => {
  const { application, version, environment } = getConfig();
  res.status(200).json({
    application,
    version,
    environment,
  });
});

module.exports = router;
