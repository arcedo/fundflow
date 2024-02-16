const express = require('express');
const router = express.Router();

// Importing routes
const auth = require('./auth');
const apiDocs = require('./api-docs');
router.use('/auth', auth);
router.use('/', apiDocs);

module.exports = router;
