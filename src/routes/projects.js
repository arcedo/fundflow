const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/projects'); // specify the directory where you want to store uploaded files
    },
    filename: function (req, file, cb) {
        // Extract the file extension
        const fileExtension = file.originalname.split('.').pop();
        // Construct the new file name using the project ID and unique ID
        const newFileName = `project_${req.params.id}_cover.${fileExtension}`;
        cb(null, newFileName);
    }
});
const uploadProjectCover = multer({
    storage: storage
});

const projectBlogs = require('./projectBlogs');
const projectImages = require('./projectImages');
const projectStats = require('./projectStats');
const projectTiers = require('./projectTiers');
const projectReviews = require('./projectReviews');

// Schemas
const StatsProjects = require('../models/statsProjects');
const SrcImages = require('../models/srcImages');

const verifyUserLogged = require('../controllers/verifyUserLogged');
const verifyAdminRole = require('../controllers/verifyAdminRole');
const getProjectStats = require('../controllers/getProjectStats');
const validateQueryParams = require('../controllers/validateQueryParams');
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

async function executeQuery(sql, params) {
    try {
        const [rows, fields] = await db.getPromise().query(sql, params);
        return rows;
    } catch (error) {
        console.error('Error executing database query:', error);
        throw error;
    }
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
    const { category, ended } = req.query;
    try {
        let sql = `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON (p.idUser = u.id) JOIN categories c ON (p.idCategory = c.id) 
            `;
        const params = [req.startIndex, req.limit];
        if (category) {
            sql += `WHERE p.idCategory = ?`;
            params.unshift(category);
        }
        if (ended === 'true') {
            sql += ` ${category ? 'AND' : 'WHERE'} p.deadlineDate < NOW()`;
        } else if (ended === 'false') {
            sql += ` ${category ? 'AND' : 'WHERE'} p.deadlineDate >= NOW()`;
        }
        sql += ` ORDER BY p.creationDate DESC LIMIT ?, ?`
        const rows = await executeQuery(sql, params);
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error("Error executing database query:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Example request: /projects/search?query=example&startIndex=0&limit=10
router.get('/search', validateQueryParams, async (req, res) => {
    try {
        const { query, category, ended } = req.query;
        let sql = `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
                FROM projects p 
                JOIN users u ON p.idUser = u.id 
                JOIN categories c ON p.idCategory = c.id 
                WHERE p.title LIKE ?`;

        // Array to hold query parameters
        const params = [`%${query}%`, req.startIndex, req.limit];

        // Adding category filter if present
        if (category) {
            sql += ` AND p.idCategory = ?`;
            params.splice(1, 0, category); // Insert category param after title search param
        }

        // Adding ended filter if present
        if (ended === 'true') {
            sql += ` AND p.deadlineDate < NOW()`;
        } else if (ended === 'false') {
            sql += ` AND p.deadlineDate >= NOW()`;
        }

        // Adding pagination
        sql += ` LIMIT ?, ?`;

        // Execute the query with parameters
        const rows = await executeQuery(sql, params);

        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
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
router.get('/byInterests', verifyUserLogged, validateQueryParams, async (req, res) => {
    try {
        const likedProjects = await StatsProjects.find({ idUser: Number(req.userId), like: true });
        if (likedProjects.length < 1) {
            return res.status(404).send({ message: 'No projects found' });
        }
        const likedProjectsCategoryIds = likedProjects.map((project) => project.idCategory);
        const rows = await executeQuery(
            `SELECT p.id, c.name AS category, p.url AS projectUrl, u.url AS userUrl, u.username AS creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON p.idUser = u.id JOIN categories c ON p.idCategory = c.id 
            WHERE p.idCategory IN (${likedProjectsCategoryIds.join(',')}) 
            LIMIT ?, ?;`,
            [req.startIndex, req.limit]
        );
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
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
        const rows = await executeQuery(
            `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id) 
            WHERE p.idCategory = ? LIMIT ?, ?`,
            [req.params.idCategory, req.startIndex, req.limit]
        );
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
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
        const rows = await executeQuery(
            `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id)
            WHERE p.idUser = ? 
            LIMIT ?, ?`,
            [req.params.idUser, req.startIndex, req.limit]);
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
            res.status(200).json(rows);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /byUser route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/byUser', verifyUserLogged, validateQueryParams, async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON(p.idUser LIKE u.id) JOIN categories c ON(p.idCategory LIKE c.id)
            WHERE p.idUser = ? 
            LIMIT ?, ?`,
            [req.userId, req.startIndex, req.limit]);
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
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
// Example request: /projects/random?startIndex=0&limit=10&lastId=0
router.get('/random', validateQueryParams, async (req, res) => {
    const { lastId } = req.query;
    try {
        const rows = await executeQuery(
            `SELECT p.id, c.name as category, p.description, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON(p.idUser = u.id) JOIN categories c ON(p.idCategory = c.id) 
            ${lastId ? `WHERE p.id != ${lastId}` : ''}
            ORDER BY RAND() 
            LIMIT ?, ?`,
            [req.startIndex, req.limit]
        );
        if (rows.length > 0) {
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                row.imgs = await SrcImages.find({ idProject: row.id });
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
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
router.get('/byId/:id', async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT p.id, c.name, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p
            JOIN users u ON p.idUser = u.id
            LEFT JOIN categories c ON p.idCategory = c.id
            WHERE p.id = ?`,
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

// Example request: /projects/byEvaluation/?evaluation=like&startIndex=0&limit=10
router.get('/byEvaluation/', verifyUserLogged, validateQueryParams, async (req, res) => {
    const { evaluation, userId } = req.query;
    try {
        let projects = [];
        switch (evaluation.toLowerCase()) {
            case 'like':
                projects = await StatsProjects.find({ idUser: req.userId, like: true });
                break;
            case 'dislike':
                projects = await StatsProjects.find({ idUser: req.userId, dislike: true });
                break;
            case 'funded':
                projects = await StatsProjects.find({ idUser: req.userId, funded: { $gt: 0 } });
                break;
            case 'collaborator':
                projects = await StatsProjects.find({ idUser: req.userId, collaborator: true });
                break;
            case 'both':
                const fundedProjects = await StatsProjects.find({ idUser: userId, funded: { $gt: 0 } });
                const collaboratorProjects = await StatsProjects.find({ idUser: userId, collaborator: true });
                projects = fundedProjects.concat(collaboratorProjects); // Combine the two arrays
                break;
            default:
                return res.status(400).send({ message: 'Invalid evaluation type' });
        }

        if (projects.length < 1) {
            return res.status(404).send({ message: 'No projects found' });
        } else {
            const [rows, fields] = await await db.getPromise().query(
                `SELECT p.id, c.name as category, p.url as projectUrl, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal
            FROM projects p JOIN users u ON (p.idUser = u.id) JOIN categories c ON (p.idCategory = c.id)
            WHERE p.id IN (${projects.map((project) => project.idProject).join(',')})
            LIMIT ?, ?`, [req.startIndex, req.limit]
            )
            await Promise.all(rows.map(async (row) => {
                const stats = await getProjectStats(row.id);
                row.stats = stats[0] ? stats[0] : {};
                if (row.stats.funded || row.stats.collaborators) {
                    row.percentageDone = Math.floor(row.collGoal ? (row.stats.collaborators / row.collGoal) * 100 : (row.stats.funded / row.priceGoal) * 100);
                } else {
                    row.percentageDone = 0;
                }
            }));
            if (rows.length > 0) {
                res.status(200).json(rows);
            } else {
                res.status(404).send({ message: 'No projects found' });
            }
        }
    } catch (error) {
        console.error('Error in /byEvaluation/ route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});


router.get('/:titleUrl', async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT p.id, c.name as categoryName, p.idCategory, p.url AS projectUrl, u.url AS userUrl, u.username as creator, p.idUser, p.title, p.priceGoal, p.collGoal, p.currency, p.description, p.creationDate, p.deadlineDate
            FROM projects p
            JOIN users u ON p.idUser = u.id
            LEFT JOIN categories c ON p.idCategory = c.id
            WHERE p.url = ?`,
            [req.params.titleUrl]
        );

        if (rows.length > 0) {
            rows[0].deadlineDate = new Date(rows[0].deadlineDate).toISOString().split('T')[0];
            const stats = await getProjectStats(rows[0].id);
            rows[0].stats = stats[0] ? stats[0] : {};
            rows[0].imgs = await SrcImages.find({ idProject: rows[0].id });
            if (rows[0].stats.funded || rows[0].stats.collaborators) {
                rows[0].percentageDone = Math.floor(rows[0].collGoal ? (rows[0].stats.collaborators / rows[0].collGoal) * 100 : (rows[0].stats.funded / rows[0].priceGoal) * 100);
            } else {
                rows[0].percentageDone = 0;
            }
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send({ message: 'No project found' });
        }
    } catch (error) {
        console.error('Error in /:id route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/:id/about', async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT about
            FROM projects
            WHERE id = ?`,
            [req.params.id]
        );
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send({ message: 'No project found', code: 404 });
        }
    } catch (error) {
        console.error('Error in /:id/about route:', error);
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
router.post('/', verifyUserLogged, async (req, res) => {
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
        let url = title.replace(/\s+/g, '_').toLowerCase();
        const [checkUrlRows, checkUrlFields] = await db.getPromise().query('SELECT id FROM projects WHERE url = ?', [url]);
        if (checkUrlRows.length > 0) {
            url = `${url}_${checkUrlRows.length}`;
        }
        if (typeGoal === 'funds' && !currency) {
            return res.status(400).json({ message: 'Currency is required!' });
        } else if (typeGoal === 'funds') {
            result = await executeQuery(
                'INSERT INTO projects (idCategory, idUser, title, url, description, priceGoal, currency, creationDate, deadlineDate, coverImageSrc) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
                [idCategory, req.userId, title, url, description, goal, currency, parsedDeadlineDate, path.join(`uploads/defaultBanners/${Math.floor(Math.random() * 2) + 1}.svg`)]
            );
        } else {
            result = await executeQuery(
                'INSERT INTO projects (idCategory, idUser, title, url, description, collGoal, creationDate, deadlineDate, coverImageSrc) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
                [idCategory, req.userId, title, url, description, goal, parsedDeadlineDate, path.join(`uploads/defaultBanners/${Math.floor(Math.random() * 2) + 1}.svg`)]
            );
        }

        if (result && result.affectedRows > 0) {
            res.status(201).json({ message: 'Project created successfully', id: result.insertId, url: url });
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
router.put('/:id', verifyUserLogged, async (req, res) => {
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
        let url = title.replace(/\s+/g, '_').toLowerCase();

        const urlInUse = await executeQuery('SELECT id FROM projects WHERE url = ? AND id != ?', [url, req.params.id]);
        if (urlInUse.length > 0) {
            url = `${url}_${urlInUse.length}`;
        }
        if (typeGoal === 'price' && !currency) {
            return res.status(400).send({ message: 'Currency is required!' });
        } else if (typeGoal === 'price') {
            // Execute the database query
            const rows = await executeQuery(
                'UPDATE projects SET idCategory = ?, title = ?, url = ?, description = ?, priceGoal = ?, currency = ?, deadlineDate = ? WHERE id = ?',
                [idCategory, title, url, description, goal, currency, parsedDeadlineDate, req.params.id]
            );
            result = rows;
        } else {
            const rows = await executeQuery(
                'UPDATE projects SET idCategory = ?, title = ?, url= ?, description = ?, collGoal = ?, deadlineDate = ? WHERE id = ?',
                [idCategory, title, url, description, goal, parsedDeadlineDate, req.params.id]
            );
            result = rows;
        }
        // Check if the project was successfully updated
        if (result.affectedRows > 0) {
            res.status(200).send({ message: 'Project updated successfully', code: 200, id: req.params.id, url: url });
        } else {
            res.status(400).send({ message: 'Unable to update project', code: 400 });
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
router.put('/:id/cover', verifyUserLogged, uploadProjectCover.single('cover'), async (req, res) => {
    try {
        // Validate required fields and their types/format if necessary
        if (!req.file) {
            return res.status(400).send({ message: 'Cover is required!', code: 400 });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET coverImageSrc = ? WHERE id = ?', [req.file.path, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project cover updated successfully', code: 200 });
        } else {
            res.status(400).send({ message: 'Unable to update project cover', code: 400 });
        }
    } catch (error) {
        console.error('Error in PUT /:id/cover route:', error);
        res.status(500).send({ message: 'Internal Server Error', code: 500 });
    }
});

router.get('/:id/cover', async (req, res) => {
    try {
        const rows = await executeQuery('SELECT coverImageSrc FROM projects WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.status(200).sendFile(path.join(__dirname, '../../', rows[0].coverImageSrc));
        } else {
            res.status(404).send({ message: 'No project found' });
        }
    } catch (error) {
        console.error('Error in GET /:id/cover route:', error);
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
router.put('/:id/about', verifyUserLogged, async (req, res) => {
    try {
        const { about } = req.body;
        // Validate required fields and their types/format if necessary
        if (!about) {
            return res.status(400).send({ message: 'About is required!', code: 400 });
        }
        // Execute the database query
        const rows = await executeQuery('UPDATE projects SET about = ? WHERE id = ?', [about, req.params.id]);
        // Check if the project was successfully updated
        if (rows.affectedRows > 0) {
            res.status(200).send({ message: 'Project about updated successfully', code: 200 });
        } else {
            res.status(400).send({ message: 'Unable to update project about', code: 400 });
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
router.delete('/:id', verifyUserLogged, verifyAdminRole, async (req, res) => {
    try {
        let rows;
        if (req.admin !== true) {
            rows = await executeQuery('DELETE FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        } else {
            rows = await executeQuery('DELETE FROM projects WHERE id = ?', [req.params.id]);
        }
        if (rows.affectedRows > 0) {
            await StatsProjects.deleteMany({ idProject: req.params.id });
            await SrcImages.deleteMany({ idProject: req.params.id });
            res.status(200).send({ message: 'Project deleted successfully', code: 200 });
        } else {
            res.status(404).send({ message: 'No project found', code: 404 });
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
router.use('/', projectTiers);
router.use('/', projectReviews);

module.exports = router;