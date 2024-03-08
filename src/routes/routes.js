const express = require('express');
const router = express.Router();

// JWT verification middleware
router.use((req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        req.user = null;
    } else {
        try {
            const decoded = jwt.verify(token.split(' ')[1], process.env.ACCESS_TOKEN_SECRET); // Replace with your actual secret key
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    }

    next();
});

// Importing routes
const auth = require('./auth');
const apiDocs = require('./api-docs');
const projects = require('./projects');
router.use('/', apiDocs);
router.use('/auth', auth);
router.use('/projects', projects);



module.exports = router;
