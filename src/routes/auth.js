const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/mySqlConnection');
const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Operations related to user authentication and registration
 * definitions:
 *   schemas:
 *     NewUser:
 *       description: New User Schema
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         confirmationPassword:
 *           type: string
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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: User credentials for registration
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewUser'
 *     responses:
 *       200:
 *         description: Successful authentication
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/NewUser'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/register', async (req, res, next) => {
    // Required fields
    const { username, email, password, confirmationPassword } = req.body;
    try {
        //TODO: maybe is better to verify the values in the front-end
        // Check if all fields are filled
        if (!username || !email || !password || !confirmationPassword) {
            // All values that are undefined are correct!
            const errorValues = {
                username: !username ? username : undefined,
                email: !email ? email : undefined,
                password: !password ? password : undefined,
                confirmationPassword: !confirmationPassword ? confirmationPassword : undefined,
            };
            return res.status(400).send({ message: 'All fields are required!', errorValues });
        }
        // Check if email is valid
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send({ message: 'Invalid email!', errorValues: { email } });
        }
        // Check if password is valid
        else if (password.length < 8) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long!', errorValues: { password } });
        }
        // Check if passwords match
        else if (password !== confirmationPassword) {
            return res.status(400).send({ message: 'Passwords do not match!', errorValues: { password, confirmationPassword } });
        }
        // Check if username already exists or email is already in use
        else {
            const [rows, fields] = await db.getPromise().query('SELECT username, email  FROM users WHERE email = ? OR username = ?', [email, username]);
            if (rows.length > 0) {
                const errorValues = {
                    username: rows[0].username === username ? username : undefined,
                    email: rows[0].email === email ? email : undefined,
                };
                return res.status(400).send({ message: 'User already exists!', errorValues: errorValues });
            }
            // Finally, if everything is correct, add user to the database
            else {
                const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt' });
                const [rowsInsert, fieldsInsert] = await db.getPromise().query(
                    'INSERT INTO users (username, email, hashPassword, userRole, registerDate) VALUES (?, ?, ?, ?, ?);',
                    [username, email, hashedPassword, 'user', new Date().toLocaleDateString('en-GB', dateOptions)]
                );
                if (rowsInsert.affectedRows > 0) {
                    // Return token
                    res.status(201).send(jwt.sign({ id: rowsInsert.insertId }, process.env.ACCESS_TOKEN_SECRET));
                } else {
                    res.status(500).send({ message: 'Something went wrong while adding your account!' });
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Something went wrong during registration!', errorCode: error });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate a user
 *     parameters:
 *       - in: body
 *         name: credentials
 *         description: User credentials for authentication
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/AuthUser'
 *     responses:
 *       200:
 *         description: Successful authentication
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/schemas/AuthUser'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send('All fields are required!');
        } else {
            const isValidEmail = username.includes('@') && username.includes('.') && username.indexOf('@') < username.lastIndexOf('.');

            const query = isValidEmail
                ? 'SELECT id, username, hashPassword, userRole FROM users WHERE email = ?'
                : 'SELECT id, username, hashPassword, userRole FROM users WHERE username = ?';

            const [rows, fields] = await db.getPromise().query(query, [username]);

            if (rows.length === 1) {
                const hashedPassword = rows[0].hashPassword;
                const passwordMatch = await Bun.password.verify(password, hashedPassword);
                if (passwordMatch) {
                    res.status(200).send(jwt.sign({ id: rows[0].id }, process.env.ACCESS_TOKEN_SECRET));
                } else {
                    res.status(401).send({ message: 'Authentication failed', errorValues: { username, password } });
                }
            } else {
                res.status(401).send({ message: 'Authentication failed', errorValues: { username, password } });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Something went wrong during login!', errorCode: error });
    }
});

module.exports = router;