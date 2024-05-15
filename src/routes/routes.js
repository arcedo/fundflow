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

router.use('/api-docs', require('./apiDocs'));
router.use('/auth', require('./auth'));
router.use('/projects', require('./projects'));
router.use('/categories', require('./categories'));
router.use('/users', require('./users'));
router.use('/follows', require('./follows'));
router.get('/', (req, res) => {
    res.status(200).send({ message: 'Welcome to FundFlow API' });
});

module.exports = router;
