const { Router } = require('express');
const router = Router();
const jwt = require('jsonwebtoken');
const db = require('../database/mySqlConnection');
const verifyUserLogged = require('../controllers/verifyUserLogged');
/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Operations related to users
 * definitions:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: The ID of the user.
 *         username:
 *           type: string
 *           description: The username of the user.
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user.
 *         name:
 *           type: string
 *           description: The first name of the user.
 *         lastName:
 *           type: string
 *           description: The last name of the user.
 *         biography:
 *           type: string
 *           description: The biography of the user.
 *       required:
 *         - id
 *         - username
 *         - email
 *         - name
 *         - lastName
 *         - biography
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The updated username of the user.
 *         email:
 *           type: string
 *           format: email
 *           description: The updated email address of the user.
 *         name:
 *           type: string
 *           description: The updated first name of the user.
 *         lastName:
 *           type: string
 *           description: The updated last name of the user.
 *         biography:
 *           type: string
 *           description: The updated biography of the user.
 *         currentPassword:
 *           type: string
 *           description: The current password of the user.
 *         newPassword:
 *           type: string
 *           description: The new password of the user.
 *         confirmPassword:
 *           type: string
 *           description: The confirmation of the new password.
 *       required:
 *         - username
 *         - email
 *         - name
 *         - lastName
 *         - biography
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve a user by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/schemas/User'
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT role, username, email, name, lastName, biography, verified, profilePictureSrc, bannerPictureSrc, registerDate FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     description: Update a user's details.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to update.
 *         schema:
 *           type: integer
 *       - in: body
 *         name: user
 *         description: User object to update.
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/UserUpdate'
 *     responses:
 *       '200':
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the success of the operation.
 *                 id:
 *                   type: integer
 *                   description: The ID of the updated user.
 *       '400':
 *         description: Bad request. All fields are required or passwords do not match.
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.put('/:id', verifyUserLogged, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, name, lastName, biography, currentPassword, newPassword, confirmPassword } = req.body;
        // TODO: Check if the updated data is already used by another user
        if (!username || !email || !name || !lastName || !biography) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let sqlQuery = 'UPDATE users SET username = ?, email = ?, name = ?, lastName = ?, biography = ? WHERE id = ? ';
        let values = [username, email, name, lastName, biography];
        if (currentPassword && newPassword && confirmPassword && newPassword === confirmPassword) {
            const [rows, fields] = await db.getPromise().query('SELECT hashPassword FROM users WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const passwordMatch = await Bun.password.verify(currentPassword, rows[0].hashPassword);
            if (passwordMatch) {
                const hashedPassword = await Bun.password.hash(newPassword);
                sqlQuery = 'UPDATE users SET username = ?, email = ?, name = ?, lastName = ?, biography = ?, hashPassword = ? WHERE id = ?';
                values.push(hashedPassword);
            } else {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
        } else {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const [rowsResult, fieldsResult] = await db.getPromise().query(sqlQuery, [...values, id]);
        if (rowsResult.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user
 *     description: Delete a user by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete.
 *         schema:
 *           type: integer
 *       - in: headers
 *         name: authorization
 *         required: true
 *         description: token from the logged user.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the success of the operation.
 *       '400':
 *         description: Bad request. ID is required.
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */

router.delete('/:id', verifyUserLogged, async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (rows.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// TODO: Two PUT routes one for the user image and another for the cover image

module.exports = router;