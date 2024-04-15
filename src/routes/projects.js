const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');

//TODO: idUser from the jwt not passed by the body

const projectBlogs = require('./projectBlogs');
const projectImages = require('./projectImages');
const projectStats = require('./projectStats');

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
 *           type: number
 *         idUser:
 *           type: number
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         goal:
 *           type: number
 *         typeGoal:
 *           type: string
 *       required: [idCategory, idUser, title, description, goal, typeGoal]
 *     UpdateProjectCover:
 *       description: Update Project Cover Schema
 *       type: object
 *       properties:
 *        cover:
 *         type: string
 *       required: [cover]
 *     UpdateProjectAbout:
 *       description: Update Project About Schema
 *       type: object
 *       properties:
 *        about:
 *         type: string
 *       required: [about]
 *     AuthUser:
 *       description: Authentication User Schema
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *       required: [username, password]
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The ID of the project.
 *         idCategory:
 *           type: integer
 *           description: The ID of the category to which the project belongs.
 *         username:
 *           type: string
 *           description: The username of the user who created the project.
 *         title:
 *           type: string
 *           description: The title of the project.
 *         stats:
 *           type: array
 *           description: The statistics of the project.
 *           items:
 *             $ref: '#/definitions/schemas/StatsProjects'
 *     StatsProjects:
 *       type: object
 *       properties:
 *         // Define properties of StatsProjects schema here
 */

function validateQueryParams(req, res, next) {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
    if (startIndex > 0 && limit > 0) {
        return res.status(400).send({ message: 'startIndex and limit query parameters are required' });
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

async function getProjectStats(projectId) {
    return await StatsProjects.aggregate([
        {
            $match: { idProject: projectId }
        },
        {
            $group: {
                _id: null,
                views: { $sum: { $cond: [{ $eq: ["$view", true] }, 1, 0] } },
                likes: { $sum: { $cond: [{ $eq: ["$like", true] }, 1, 0] } },
                dislikes: { $sum: { $cond: [{ $eq: ["$dislike", true] }, 1, 0] } },
                funded: { $sum: "$funded" },
                collaborators: { $sum: { $cond: [{ $eq: ["$collaborator", true] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                views: 1,
                likes: 1,
                dislikes: 1,
                funded: 1,
                collaborators: 1
            }
        }
    ]);
}

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Retrieve a list of projects with optional pagination
 *     tags:
 *       - Projects
 *     description: Retrieves a list of projects from the database with optional pagination support. Requires query parameters `startIndex` and `limit`.
 *     parameters:
 *       - in: query
 *         name: startIndex
 *         required: true
 *         description: The index from which to start fetching projects (0-indexed).
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: true
 *         description: The maximum number of projects to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of projects retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '400':
 *         description: Bad request. startIndex and limit query parameters are required.
 *       '404':
 *         description: No projects found.
 *       '500':
 *         description: Internal server error.
 */
// Example request: /projects?startIndex=0&limit=10
router.get('/', validateQueryParams, async (req, res) => {
    // Access the validated values from the request object
    const startIndex = req.startIndex;
    const limit = req.limit;
    try {
        const rows = await executeQuery(
            `SELECT p.id, c.name, c.id, u.username as creator, p.title, p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
            FROM projects p JOIN users u ON (p.idUser LIKE u.id) JOIN categories c ON (p.idCategory LIKE c.id) 
            ORDER BY p.creationDate 
            LIMIT ?, ?`,
            [startIndex, limit]
        );
        if (rows.length > 0) {
            for (const row of rows) {
                // Merge the stats object with the project object
                row.stats = getProjectStats(row.id);
            }
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error("Error executing database query:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/byInterests:
 *   get:
 *     summary: Retrieve projects based on user's interests
 *     tags:
 *       - Projects
 *     description: Retrieves projects based on the interests of the authenticated user. Requires query parameters `startIndex` and `limit`.
 *     parameters:
 *       - in: query
 *         name: startIndex
 *         required: true
 *         description: The index from which to start fetching projects (0-indexed).
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: true
 *         description: The maximum number of projects to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of projects retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '400':
 *         description: Bad request. User ID is missing.
 *       '404':
 *         description: No projects found.
 *       '500':
 *         description: Internal server error.
 */
// Example request: /projects/byInterests?startIndex=0&limit=10
router.get('/byInterests', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const userId = req.user;
        if (userId) {
            const likedProjectsIds = await StatsProjects.find({ idUser: userId, likes: true }).map((project) => project.idProject);
            const rows = await executeQuery(
                `SELECT p.id, c.name, c.id, u.username as creator, p.title, p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
                FROM projects p JOIN users u ON (p.idUser LIKE u.id) JOIN categories c ON (p.idCategory LIKE c.id) 
                WHERE p.idCategory IN (SELECT p2.idCategory FROM projects p2 WHERE p2.id IN(?)) 
                LIMIT ?, ?`,
                [likedProjectsIds, startIndex, limit]
            );
            if (rows.length > 0) {
                for (const row of rows) {
                    // Merge the stats object with the project object
                    row.stats = getProjectStats(row.id);
                }
                res.status(200).json(rows);
            } else {
                res.status(404).send({ message: 'No projects found' });
            }
        } else {
            res.status(400).send({ message: 'User ID is missing' });
        }
    } catch (error) {
        console.error('Error in /byInterests route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/byCategory/{idCategory}:
 *   get:
 *     summary: Retrieve projects by category
 *     tags:
 *       - Projects
 *     description: Retrieves projects based on a specified category. Requires query parameters `startIndex` and `limit`.
 *     parameters:
 *       - in: path
 *         name: idCategory
 *         required: true
 *         description: The ID of the category.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startIndex
 *         required: true
 *         description: The index from which to start fetching projects (0-indexed).
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: true
 *         description: The maximum number of projects to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of projects retrieved successfully.ORDER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '404':
 *         description: No projects found.
 *       '500':
 *         description: Internal server error.
 */
// Example request: /projects/byCategory/1?startIndex=0&limit=10
router.get('/byCategory/:idCategory', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery(
            `SELECT p.id, c.name, c.id, u.username as creator, p.title, p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id) 
            WHERE p.idCategory = ? LIMIT ?, ?`,
            [req.params.idCategory, startIndex, limit]
        );
        if (rows.length > 0) {
            for (const row of rows) {
                // Merge the stats object with the project object
                row.stats = getProjectStats(row.id);
            }
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /byCategory route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/byUser/{idUser}:
 *   get:
 *     summary: Retrieve projects by user
 *     tags:
 *       - Projects
 *     description: Retrieves projects created by a specified user. Requires query parameters `startIndex` and `limit`.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startIndex
 *         required: true
 *         description: The index from which to start fetching projects (0-indexed).
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: true
 *         description: The maximum number of projects to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of projects retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '404':
 *         description: No projects found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/byUser/:idUser', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery(
            `SELECT p.id, c.name, c.id, u.username as creator, p.title,  p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id)
            WHERE p.idUser = ? 
            LIMIT ?, ?`,
            [req.params.idUser, startIndex, limit]);
        if (rows.length > 0) {
            for (const row of rows) {
                // Merge the stats object with the project object
                row.stats = getProjectStats(row.id);
            }
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /byUser route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/random:
 *   get:
 *     summary: Retrieve random projects
 *     tags:
 *       - Projects
 *     description: Retrieves a random selection of projects. Requires query parameters `startIndex` and `limit`.
 *     parameters:
 *       - in: query
 *         name: startIndex
 *         required: true
 *         description: The index from which to start fetching projects (0-indexed).
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: true
 *         description: The maximum number of projects to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A list of projects retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '404':
 *         description: No projects found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/random', validateQueryParams, async (req, res) => {
    try {
        const startIndex = req.startIndex;
        const limit = req.limit;
        const rows = await executeQuery(
            `SELECT p.id, c.name, c.id, u.username as creator, p.title, p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id) 
            ORDER BY RAND() 
            LIMIT ?, ?`,
            [startIndex, limit]
        );
        if (rows.length > 0) {
            for (const row of rows) {
                // Merge the stats object with the project object
                row.stats = getProjectStats(row.id);
                // TODO: add image gallery of the project
            }
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /random route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Retrieve a project by ID
 *     tags:
 *       - Projects
 *     description: Retrieves a project by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the project.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Project retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Project'
 *       '404':
 *         description: No project found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/:id', async (req, res) => {
    try {
        const rows = await executeQuery(`
            SELECT p.id, c.name, c.id as idCategory, u.username as creator, p.title, p.priceGoal, p.collGoal, u.profilePictureSrc, p.coverImageSrc
            FROM projects p
            JOIN users u ON p.idUser = u.id
            LEFT JOIN categories c ON p.idCategory = c.id
            WHERE p.id = ?;`,
            [req.params.id]
        );
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send({ message: 'No project found' });
        }
    } catch (error) {
        console.error('Error in /:id route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags:
 *       - Projects
 *     description: Create a new project with the provided details.
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: User credentials for registration
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProject'
 *     responses:
 *       '201':
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                $ref: '#/definitions/schemas/NewProject'
 *       '400':
 *         description: Bad request. Required fields are missing or invalid.
 *       '500':
 *         description: Internal server error.
 */
router.post('/', async (req, res) => {
    if (!req.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { idCategory, title, description, goal, typeGoal, currency, deadlineDate } = req.body;

        // Validate required fields
        if (!idCategory || !title || !description || !goal || !typeGoal || !deadlineDate) {
            return res.status(400).json({ message: 'All fields are required!' });
        }

        // Check if goal is a valid number
        if (isNaN(Number(goal))) {
            return res.status(400).json({ message: 'Goal must be a valid number!' });
        }

        // Check if deadlineDate is a valid date format
        const parsedDeadlineDate = new Date(deadlineDate);
        if (isNaN(parsedDeadlineDate.getTime())) {
            return res.status(400).json({ message: 'Deadline date must be a valid date format!' });
        }

        let result;
        if (typeGoal === 'price' && !currency) {
            return res.status(400).json({ message: 'Currency is required!' });
        } else if (typeGoal === 'price') {
            result = await executeQuery(
                'INSERT INTO projects (idCategory, idUser, title, description, priceGoal, currency, creationDate, deadlineDate) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
                [idCategory, req.userId, title, description, goal, currency, parsedDeadlineDate]
            );
        } else {
            result = await executeQuery(
                'INSERT INTO projects (idCategory, idUser, title, description, collGoal, creationDate, deadlineDate) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
                [idCategory, req.userId, title, description, goal, parsedDeadlineDate]
            );
        }

        if (result && result.affectedRows > 0) {
            res.status(201).json({ message: 'Project created successfully', id: result.insertId });
        } else {
            res.status(400).json({ message: 'Unable to create project' });
        }
    } catch (error) {
        console.error('Error in POST / route:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project by ID
 *     tags:
 *       - Projects
 *     description: Update an existing project with the provided details.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to update
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: projectDetails
 *         description: Project details to update
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProject'
 *     responses:
 *       '200':
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. Required fields are missing or invalid.
 *       '404':
 *         description: No project found with the provided ID.
 *       '500':
 *         description: Internal server error.
 */
router.put('/:id', async (req, res) => {
    if (!req.userId) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    try {
        const { idCategory, title, description, deadlineDate, goal, currency, typeGoal } = req.body;
        // Validate required fields and their types/format if necessary
        if (!idCategory || !title || !description || !deadlineDate) {
            return res.status(400).send({ message: 'All fields are required!' });
        }
        // Check if deadlineDate is a valid date format
        const parsedDeadlineDate = new Date(deadlineDate);
        if (isNaN(parsedDeadlineDate.getTime())) {
            return res.status(400).send({ message: 'Deadline date must be a valid date format!' });
        }

        let result;
        if (typeGoal === 'price' && !currency) {
            return res.status(400).send({ message: 'Currency is required!' });
        } else if (typeGoal === 'price') {
            // Execute the database query
            const rows = await executeQuery(
                'UPDATE projects SET idCategory = ?, title = ?, description = ?, collGoal = ?, currency = ?, deadlineDate = ? WHERE id = ?',
                [idCategory, title, description, goal, currency, parsedDeadlineDate, req.params.id]
            );
            result = rows;
        } else {
            const rows = await executeQuery(
                'UPDATE projects SET idCategory = ?, title = ?, description = ?, collGoal = ?, deadlineDate = ? WHERE id = ?',
                [idCategory, title, description, goal, parsedDeadlineDate, req.params.id]
            );
            result = rows;
        }
        // Check if the project was successfully updated
        if (result.affectedRows > 0) {
            res.status(200).send({ message: 'Project updated successfully' });
        } else {
            res.status(400).send({ message: 'Unable to update project' });
        }
    } catch (error) {
        console.error('Error in PUT /:id route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}/cover:
 *   put:
 *     summary: Update project cover image by ID
 *     tags:
 *       - Projects
 *     description: Update the cover image of an existing project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to update the cover image
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: coverImage
 *         description: Cover image details to update
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/UpdateProjectCover'
 *     responses:
 *       '200':
 *         description: Project cover updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. Cover image is missing.
 *       '500':
 *         description: Internal server error.
 */
router.put('/:id/cover', async (req, res) => {
    try {
        const { cover } = req.body;
        // Validate required fields and their types/format if necessary
        if (!cover) {
            return res.status(400).send({ message: 'Cover is required!' });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET coverImageSrc = ? WHERE id = ?', [cover, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project cover updated successfully' });
        } else {
            res.status(400).send({ message: 'Unable to update project cover' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/cover route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 *  /projects/{id}/about:
 *   put:
 *     summary: Update project about section by ID
 *     tags:
 *       - Projects
 *     description: Update the about section of an existing project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to update the about section
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: aboutSection
 *         description: About section details to update
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/UpdateProjectAbout'
 *     responses:
 *       '200':
 *         description: Project about section updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. About section is missing.
 *       '500':
 *         description: Internal server error.
 */
router.put('/:id/about', async (req, res) => {
    try {
        const { about } = req.body;
        // Validate required fields and their types/format if necessary
        if (!about) {
            return res.status(400).send({ message: 'About is required!' });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET about = ? WHERE id = ?', [about, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project about updated successfully' });
        } else {
            res.status(400).send({ message: 'Unable to update project about' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/about route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags:
 *       - Projects
 *     description: Delete an existing project by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Project deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '404':
 *         description: No project found with the provided ID.
 *       '500':
 *         description: Internal server error.
 */
router.delete('/:id', async (req, res) => {
    if (!req.userId) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    try {
        const statsDeleted = await StatsProjects.deleteMany({ idProject: req.params.id });

        if (statsDeleted.deletedCount > 0) {
            const rows = await executeQuery('DELETE FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
            if (rows.affectedRows > 0) {
                res.status(200).send({ message: 'Project deleted successfully' });
            } else {
                res.status(404).send({ message: 'No project found' });
            }
        } else {
            res.status(400).send({ message: 'Unable to delete project' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Include the other project related routes
router.use('/', projectBlogs);
router.use('/', projectImages);
router.use('/', projectStats);

module.exports = router;