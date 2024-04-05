const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// JWT verification middleware
router.use((req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        req.user = null; // Empty user
    } else {
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = decoded;
        } catch (err) {
            console.error(err);
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
    next();
});

const apiDocs = require('./apiDocs');
const auth = require('./auth');
const projects = require('./projects');
const categories = require('./categories');
const users = require('./users');

router.use('/', apiDocs);
router.use('/auth', auth);
router.use('/projects', projects);
router.use('/categories', categories);
router.use('/users', users);

module.exports = router;
