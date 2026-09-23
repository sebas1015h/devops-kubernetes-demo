const express = require('express');
const { getSystemInfo } = require('../utils/systemInfo');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json(getSystemInfo());
});

module.exports = router;
