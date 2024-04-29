const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// JWT verification middleware
router.use((req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        req.userId = null; // Empty user
    } else {
        try {
            const decoded = jwt.verify(token.toString(), process.env.ACCESS_TOKEN_SECRET);
            req.userId = decoded.id;
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

router.use('/api-docs', apiDocs);
router.use('/auth', auth);
router.use('/projects', projects);
router.use('/categories', categories);
router.use('/users', users);
router.get('/', (req, res) => {
    res.status(200).send({ message: 'Welcome to FundFlow API' });
});

module.exports = router;
