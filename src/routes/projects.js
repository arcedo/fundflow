const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const StatsProjects = require('../models/StatsProjects');

function validateQueryParams(req, res, next) {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
    console.log(startIndex, limit);
    if (startIndex > 0 && limit > 0) {
        return res.status(400).send({ error: 'startIndex and limit query parameters are required' });
    } else {
        // Store the validated values in the request object
        req.startIndex = startIndex;
        req.limit = limit;
        next();
    }
}

async function executeQuery(sql, params) {
    try {
        const [rows, fields] = await db.getPromise().query(sql, params);
        return rows;
    } catch (error) {
        console.error('Error executing database query:', error);
        throw error;
    }
}

// Example request: /projects?startIndex=0&limit=10
router.get('/', validateQueryParams, async (req, res) => {
    // Access the validated values from the request object
    const startIndex = req.startIndex;
    const limit = req.limit;
    try {
        const rows = await executeQuery('SELECT * FROM projects LIMIT ?, ?', [startIndex, limit]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error("Error executing database query:", error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Example request: /projects/byInterests?startIndex=0&limit=10
router.get('/byInterests', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const userId = req.user;
        if (userId) {
            const likedProjects = await StatsProjects.find({ idUser: userId, likes: { $eq: true } });
            const projectsIds = likedProjects.map((project) => project.idProject);
            const rows = await executeQuery('SELECT p.* FROM projects p WHERE p.idCategory IN (SELECT p2.idCategory FROM projects p2 WHERE p2.id IN(?)) LIMIT ?, ?;', [projectsIds, startIndex, limit]);
            if (rows.length > 0) {
                res.status(200).json(rows);
            } else {
                res.status(404).send({ error: 'No projects found' });
            }
        } else {
            res.status(400).send({ error: 'User ID is missing' });
        }
    } catch (error) {
        console.error('Error in /byInterests route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Example request: /projects/byCategory/1?startIndex=0&limit=10
router.get('/byCategory/:idCategory', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery('SELECT * FROM projects WHERE idCategory = ? LIMIT ?, ?', [req.params.idCategory, startIndex, limit]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /byCategory route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.get('/byUser/:idUser', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery('SELECT * FROM projects WHERE idUser = ? LIMIT ?, ?', [req.params.idUser, startIndex, limit]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /byUser route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.get('/random', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery('SELECT * FROM projects ORDER BY RAND() LIMIT ?, ?', [startIndex, limit]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /random route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const rows = await executeQuery('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send({ message: 'No project found' });
        }
    } catch (error) {
        console.error('Error in /:id route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;