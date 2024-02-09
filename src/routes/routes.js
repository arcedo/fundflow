const express = require('express');
const router = express.Router();

// Importing routes
const auth = require('./auth');

router.use('/auth', auth);

module.exports = router;
