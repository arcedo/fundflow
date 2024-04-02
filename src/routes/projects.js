const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');

//TODO: idUser from the jwt not passed by the body

// Schemas
const StatsProjects = require('../models/statsProjects');
const SrcImages = require('../models/srcImages');

//swagger documentation for projects
/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Operations related to project management
 * definitions:
 *   schemas:
 *     NewProject:
 *       description: New Project Schema
 *       type: object
 *       properties:
 *         idCategory:
 *          type: number
 *         idUser:
 *          type: number
 *         title:
 *          type: string
 *         description:
 *          type: string
 *         goal:
 *          type: number
 *         typeGoal:
 *          type: string
 *       required: [username, email, password, confirmationPassword]
 *
 *     AuthUser:
 *       description: Authentication User Schema
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *       required: ['username', 'password']
 */

function validateQueryParams(req, res, next) {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
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
        const rows = await executeQuery('SELECT p.id, p.idCategory, u.username, p.title FROM projects p JOIN users u ON (p.idUser LIKE u.id) LIMIT ?, ?', [startIndex, limit]);
        if (rows.length > 0) {
            for (const row of rows) {
                const projectStats = await StatsProjects.find({ idProject: row.id });
                // Merge the stats object with the project object
                row.stats = projectStats;
            }
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
            const likedProjectsIds = await StatsProjects.find({ idUser: userId, likes: true }).map((project) => project.idProject);
            const rows = await executeQuery('SELECT p.* FROM projects p WHERE p.idCategory IN (SELECT p2.idCategory FROM projects p2 WHERE p2.id IN(?)) LIMIT ?, ?;', [likedProjectsIds, startIndex, limit]);
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

router.post('/', async (req, res) => {
    try {
        const { idCategory, idUser, title, description, goal, typeGoal, currency, deadlineDate } = req.body;
        // Validate required fields and their types/format if necessary
        if (!idCategory || !idUser || !title || !description || !goal || !typeGoal || !currency || !deadlineDate) {
            return res.status(400).send({ error: 'All fields are required!' });
        }
        // Check if goal is a valid number
        if (isNaN(Number(goal))) {
            return res.status(400).send({ error: 'Goal must be a valid number!' });
        }
        // Check if deadlineDate is a valid date format
        const parsedDeadlineDate = new Date(deadlineDate);
        if (isNaN(parsedDeadlineDate.getTime())) {
            return res.status(400).send({ error: 'Deadline date must be a valid date format!' });
        }
        // Execute the database query
        const rows = await executeQuery(
            'INSERT INTO projects (idCategory, idUser, title, description, goal, typeGoal, currency, creationDate, deadlineDate) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
            [idCategory, idUser, title, description, goal, typeGoal, currency, parsedDeadlineDate]
        );
        // Check if the project was successfully created
        if (rows.affectedRows > 0) {
            res.status(201).send({ message: 'Project created successfully' });
        } else {
            res.status(400).send({ error: 'Unable to create project' });
        }
    } catch (error) {
        console.error('Error in POST / route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { idCategory, title, description, deadlineDate } = req.body;
        // Validate required fields and their types/format if necessary
        if (!idCategory || !title || !description || !deadlineDate) {
            return res.status(400).send({ error: 'All fields are required!' });
        }
        // Check if deadlineDate is a valid date format
        const parsedDeadlineDate = new Date(deadlineDate);
        if (isNaN(parsedDeadlineDate.getTime())) {
            return res.status(400).send({ error: 'Deadline date must be a valid date format!' });
        }
        // Execute the database query
        const rows = await executeQuery(
            'UPDATE projects SET idCategory = ?, title = ?, description = ?, goal = ?, typeGoal = ?, currency = ?, deadlineDate = ? WHERE id = ?',
            [idCategory, title, description, parsedDeadlineDate, req.params.id]
        );
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project updated successfully' });
        } else {
            res.status(400).send({ error: 'Unable to update project' });
        }
    } catch (error) {
        console.error('Error in PUT /:id route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.put('/:id/cover', async (req, res) => {
    try {
        const { cover } = req.body;
        // Validate required fields and their types/format if necessary
        if (!cover) {
            return res.status(400).send({ error: 'Cover is required!' });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET coverImageSrc = ? WHERE id = ?', [cover, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project cover updated successfully' });
        } else {
            res.status(400).send({ error: 'Unable to update project cover' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/cover route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.put('/:id/about', async (req, res) => {
    try {
        const { about } = req.body;
        // Validate required fields and their types/format if necessary
        if (!about) {
            return res.status(400).send({ error: 'About is required!' });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET about = ? WHERE id = ?', [about, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project about updated successfully' });
        } else {
            res.status(400).send({ error: 'Unable to update project about' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/about route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const statsDeleted = await StatsProjects.deleteMany({ idProject: req.params.id });

        if (statsDeleted.deletedCount > 0) {
            const rows = await executeQuery('DELETE FROM projects WHERE id = ?', [req.params.id]);
            if (rows.affectedRows > 0) {
                res.status(200).send({ message: 'Project deleted successfully' });
            } else {
                res.status(404).send({ error: 'No project found' });
            }
        } else {
            res.status(400).send({ error: 'Unable to delete project' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;