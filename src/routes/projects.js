const express = require('express');
const router = express.Router();
const db = require('../database/mySqlConnection');
const jwt = require('jsonwebtoken');
/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Operations related to projects
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
 *         priceGoal:
 *           type: number
 *         collGoal:
 *           type: number
 *         views:
 *           type: number
 *         deadlineDate:
 *           type: string
 *       required: [idCategory, idUser, title, description, priceGoal, collGoal, views, deadlineDate]
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all projects
 *     description: Get all projects
 *     parameters:
 *       - in: query
 *         name: startIndex
 *         description: Start index
 *         required: true
 *         type: number
 *       - in: query
 *         name: limit
 *         description: Limit of projects
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/NewProject'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No projects found
 *       500:
 *         description: Internal Server Error
 */
//Request Example: /projects?startIndex=0&limit=10
router.get('/', (req, res) => {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
    db.query('SELECT * FROM projects ORDER BY creationDate ASC LIMIT ?, ?', [startIndex, limit], (err, result) => {
        if (err) {
            res.status(500).json({ message: err });
        } else if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'No projects found' });
        }
    });
});
// Request Example: /projects/byInterest?startIndex=0&limit=10
router.get('/byInterest', (req, res) => {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
    const userId = req.user;
    db.query('SELECT cat.name FROM stat', [userId, startIndex, limit], (err, result) => {

    });

});

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get a project by id
 *     description: Get a project by id
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Project id
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Successful request
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/NewProject'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No project found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM projects WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ message: err });
        } else if (result.length > 0) {
            res.status(200).json(result);
        } else {
            res.status(404).json({ message: 'No project found' });
        }
    });
});

/**
 * @swagger
 * /projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a new project
 *     description: Create a new project
 *     parameters:
 *       - in: body
 *         name: project
 *         description: Project to add
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProject'
 *     responses:
 *       201:
 *         description: Project created
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/NewProject'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/', (req, res) => {
    const project = req.body;
    db.query('INSERT INTO projects SET ?', project, (err, result) => {
        if (err) {
            res.status(500).json({ message: err });
        } else {
            res.status(201).json({ message: 'Project created' });
        }
    });
});


/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Update a project
 *     description: Update a project
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Project id
 *         required: true
 *         type: number
 *       - in: body
 *         name: project
 *         description: Project to update
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProject'
 *     responses:
 *       200:
 *         description: Project updated
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/NewProject'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No project found
 *       500:
 *         description: Internal Server Error
 */
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const project = req.body;
    db.query('UPDATE projects SET ? WHERE id = ?', [project, id], (err, result) => {
        if (err) {
            res.status(500).json({ message: err });
        } else if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Project updated' });
        } else {
            res.status(404).json({ message: 'No project found' });
        }
    });
});

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Delete a project
 *     description: Delete a project
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Project id
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Project deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No project found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM projects WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ message: err });
        } else if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Project deleted' });
        } else {
            res.status(404).json({ message: 'No project found' });
        }
    });
});

module.exports = router;
