const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/mySqlConnection');
const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

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
                    res.status(201).send(jwt.sign(rowsInsert.insertId, process.env.ACCESS_TOKEN_SECRET));
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

router.post('/login', async (req, res, next) => {
    try {
    } catch (error) {
        res.status(500).send('Something went wrong during login!');
    }
});

module.exports = router;