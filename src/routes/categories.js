const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const verifyAdminRole = require('../controllers/verifyAdminRole');
// TODO: this routes are only for admin users
/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Operations related to categories
 * definitions:
 *   schemas:
 *     NewCategory:
 *       type: object
 *       properties:
 *        name:
 *         type: string
 *         description: The name of the category.
 *       required:
 *        - name
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The ID of the category.
 *         name:
 *           type: string
 *           description: The name of the category.
 *       required:
 *         - id
 *         - name
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     description: Retrieve all categories from the database.
 *     responses:
 *       '200':
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/schemas/Category'
 *       '404':
 *         description: No categories found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT * FROM categories');
        if (rows.length === 0) {
            res.status(404).send({ message: 'No categories found' });
        } else {
            res.status(200).send(rows);
        }
    } catch (error) {
        console.error('Error in /categories GET', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 *     description: Retrieve a category by its ID from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the category to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: A single category object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/Category'
 *       '404':
 *         description: Category not found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            res.status(404).send({ message: 'Category not found' });
        } else {
            res.status(200).send(rows[0]);
        }
    } catch (error) {
        console.error('Error in /categories/:id GET', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     description: Create a new category with the provided name.
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: User credentials for registration
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewCategory'
 *     responses:
 *       '201':
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: integer
 *       '400':
 *         description: Bad request. Name is required.
 *       '500':
 *         description: Internal server error.
 */
router.post('/', verifyAdminRole, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({ message: 'Name is required' });
        }
        const [rows, fields] = await db.getPromise().query('INSERT INTO categories (name) VALUES (?)', [name]);
        if (rows.affectedRows === 0) {
            return res.status(400).send({ message: 'Unable to create category' });
        } else {
            res.status(201).send({ message: 'Category created successfully', id: rows.insertId });
        }
    } catch (error) {
        console.error('Error in /categories POST', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags:
 *       - Categories
 *     description: Delete a category by its ID from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the category to delete
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Category deleted successfully.
 *       '404':
 *         description: Category not found.
 *       '500':
 *         description: Internal server error.
 */
router.delete('/:id', verifyAdminRole, async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send({ message: 'ID is required' });
        }
        const [rows, fields] = await db.getPromise().query('DELETE FROM categories WHERE id = ?', [id]);
        if (rows.affectedRows === 0) {
            res.status(404).send({ message: 'Category not found' });
        } else {
            res.status(200).send({ message: 'Category deleted successfully' });
        }
    } catch (error) {
        console.error('Error in /categories/:id DELETE', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

module.exports = router;