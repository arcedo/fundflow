const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const verifyUserLogged = require('../controllers/verifyUserLogged');
const verifyAdminRole = require('../controllers/verifyAdminRole');
const UserFollows = require('../models/userFollows');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const validateQueryParams = require('../controllers/validateQueryParams');

const storageProfilePicture = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profiles');
    },
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        //const timestamp = Date.now();
        const newFileName = `user_${req.userId}.${fileExtension}`;
        cb(null, newFileName);
    }
});
const storageProfileCover = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profiles');
    },
    filename: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        //const timestamp = Date.now();
        const newFileName = `user_${req.userId}_cover.${fileExtension}`;
        cb(null, newFileName);
    }
});
const uploadProfilePicture = multer({ storage: storageProfilePicture });
const uploadProfileCover = multer({ storage: storageProfileCover });
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
router.get('/byId/:id', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT role, username, url, email, name, lastName, biography, verified, verifiedEmail, registerDate FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:url', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT id, role, username, url, email, name, lastName, biography, verified, verifiedEmail, registerDate FROM users WHERE url = ?', [req.params.url]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        rows[0].following = await UserFollows.countDocuments({ followsUserUrl: rows[0].url });
        rows[0].followers = await UserFollows.countDocuments({ userUrl: rows[0].url });
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', verifyUserLogged, async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query(`SELECT role, username, url, email, name, lastName, biography, verified, verifiedEmail, googleAccount, registerDate FROM users WHERE id = ?`, [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/search/user', validateQueryParams, async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) {
            return res.status(400).json({ message: 'Search parameter is required' });
        }
        const [rows, fields] = await db.getPromise().query(`
        SELECT id, username, url, verified, verifiedEmail FROM users 
        WHERE username LIKE ? OR url LIKE ? 
        LIMIT ?, ?`,
            [`%${search}%`, `%${search}%`, req.startIndex, req.limit]);
        res.json(rows);
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
router.put('/', verifyUserLogged, async (req, res) => {
    try {
        const { username, email, name, lastName, biography, currentPassword } = req.body;
        if (!username || !email) {
            return res.status(400).json({ message: 'These fields are required: username and email' });
        }
        const [rows, fields] = await db.getPromise().query('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, req.userId]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Username or email already in use', errorValues: { username, email } });
        }
        const url = username.replace(/\s+/g, '_').toLowerCase();
        const [rowsLoggedUser, fieldsLoggedUser] = await db.getPromise().query('SELECT hashPassword FROM users WHERE id = ?', [req.userId]);
        let sqlQuery = 'UPDATE users SET username = ?, email = ?, name = ?, lastName = ?, biography = ?, url = ?';
        const values = [username, email, name, lastName, biography, url];
        const passwordMatch = await Bun.password.verify(currentPassword, rowsLoggedUser[0].hashPassword);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Current password is incorrect', errorValues: { currentPassword } });
        }
        sqlQuery += ' WHERE id = ?';
        const [rowsResult, fieldsResult] = await db.getPromise().query(sqlQuery, [...values, req.userId]);
        if (rowsResult.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', id: req.userId, url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/changePassword', verifyUserLogged, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'These fields are required: currentPassword, newPassword and confirmPassword', errorValues: { currentPassword, newPassword, confirmPassword } });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match', errorValues: { newPassword, confirmPassword } });
        }
        const [rows, fields] = await db.getPromise().query('SELECT hashPassword FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const passwordMatch = await Bun.password.verify(currentPassword, rows[0].hashPassword);
        if (passwordMatch) {
            const hashedPassword = await Bun.password.hash(newPassword);
            const [rowsResult, fieldsResult] = await db.getPromise().query('UPDATE users SET hashPassword = ? WHERE id = ?', [hashedPassword, req.userId]);
            if (rowsResult.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'Password updated successfully', id: req.userId });
        } else {
            return res.status(400).json({ message: 'Current password is incorrect', errorValues: { currentPassword } });
        }
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
//For admin users
router.delete('/:id', verifyAdminRole, async (req, res) => {
    if (req.admin !== true) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const [rows, fields] = await db.getPromise().query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (rows.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Delete your own user
router.delete('/', verifyUserLogged, async (req, res) => {
    const { password } = req.body;
    try {
        const [rows, fields] = await db.getPromise().query('SELECT hashPassword, googleAccount FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (rows[0].googleAccount !== 1) {
            if (!password) {
                return res.status(400).json({ message: 'Password is required' });
            }
            const passwordMatch = await Bun.password.verify(password, rows[0].hashPassword);
            if (!passwordMatch) {
                return res.status(400).json({ message: 'Password is incorrect' });
            }
        }
        const [deleteRows, deleteFields] = await db.getPromise().query('DELETE FROM users WHERE id = ?', [req.userId]);
        if (deleteRows.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', id: req.userId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Profile Images
router.put('/profilePicture', verifyUserLogged, uploadProfilePicture.single('profilePicture'), async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    try {
        const [currentUserRows, currentUserFields] = await db.getPromise().query('SELECT profilePictureSrc, hashPassword FROM users WHERE id = ?', [req.userId]);
        if (currentUserRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const passwordMatch = await Bun.password.verify(password, currentUserRows[0].hashPassword);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Password is incorrect' });
        } else {
            const [rows, fields] = await db.getPromise().query('UPDATE users SET profilePictureSrc = ? WHERE id = ?', [req.file.path, req.userId]);
            if (rows.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'Profile picture updated successfully', id: req.userId });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/profileCover', verifyUserLogged, uploadProfileCover.single('profileCover'), async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    try {
        const [currentUserRows, currentUserFields] = await db.getPromise().query('SELECT bannerPictureSrc, hashPassword FROM users WHERE id = ?', [req.userId]);
        if (currentUserRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const passwordMatch = await Bun.password.verify(password, currentUserRows[0].hashPassword);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Password is incorrect' });
        } else {
            const [rows, fields] = await db.getPromise().query('UPDATE users SET bannerPictureSrc = ? WHERE id = ?', [req.file.path, req.userId]);
            if (rows.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'Profile cover updated successfully', id: req.userId });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:userUrl/profilePicture', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT profilePictureSrc FROM users WHERE url = ?', [req.params.userUrl]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!rows[0].profilePictureSrc) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }
        res.sendFile(path.join(__dirname, '../../', rows[0].profilePictureSrc));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:userUrl/profileBanner', async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT bannerPictureSrc FROM users WHERE url = ?', [req.params.userUrl]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!rows[0].bannerPictureSrc) {
            return res.status(404).json({ message: 'Profile cover not found' });
        }
        res.sendFile(path.join(__dirname, '../../', rows[0].bannerPictureSrc));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/admin/panel', verifyAdminRole, validateQueryParams, async (req, res) => {
    if (!req.admin) {
        return res.status(403).json({ message: 'Not allowed' });
    }
    try {
        const [rows] = await db.getPromise().query(`SELECT id, username, email, url FROM users LIMIT ?, ?;`, [req.startIndex, req.limit]);
        if (rows.length > 0) {
            res.status(200).json(rows);
        } else {
            res.status(404).json({ message: 'No users found', code: 404 });
        }
    } catch (error) {
        console.error('Error in GET /admin route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;