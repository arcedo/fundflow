const { Router } = require('express');
const router = Router();
const jwt = require('jsonwebtoken');
const db = require('../database/mySqlConnection');
const path = require('path');
const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
const { Resend } = require('resend');
const verifyUserLogged = require('../controllers/verifyUserLogged');
const htmlVerifyMail = require('../../public/htmlVerifyMail');
const htmlRecoverPassword = require('../../public/htmlRecoverPassword');

const resend = new Resend(process.env.RESEND_API_KEY);

function sendVerificationEmail(email, userId, username) {
    //TODO: is secure to send the id from the user?
    const code = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    if (!code) {
        return { message: 'Error generating token!', error: err, code: 500 };
    }
    const { error } = resend.emails.send({
        from: "fundflow By Reasonable <noreply@fundflow.arcedo.dev>",
        to: [email],
        subject: `Email Verification for ${username} on fundflow - ${new Date().toLocaleDateString('en-GB', dateOptions)}`,
        text: 'Please verify your email address by clicking the link below',
        html: htmlVerifyMail(code, username),
    });
    if (error) {
        return { message: 'Error sending verification email!', error, code: 500 };
    }
    return { message: 'Verification email sent!', code: 200 };
}

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
            // All values that are undefined are correct!token
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
            const [rows, fields] = await db.getPromise().query('SELECT username, email FROM users WHERE email = ? OR username = ?', [email, username]);
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
                const userUrl = username.replace(/\s+/g, '_').toLowerCase();
                const [rowsInsert, fieldsInsert] = await db.getPromise().query(
                    'INSERT INTO users (username, email, hashPassword, registerDate, url, profilePictureSrc, bannerPictureSrc) VALUES (?, ?, ?, ?, ?, ?, ?);',
                    [username, email, hashedPassword, new Date().toLocaleDateString('en-GB', dateOptions), userUrl, path.join(`uploads/defaultAvatars/${Math.floor(Math.random() * 6) + 1}.svg`), path.join(`uploads/defaultBanners/${Math.floor(Math.random() * 2) + 1}.svg`)]
                );
                if (rowsInsert.affectedRows > 0) {
                    // Send verification email
                    const emailResponse = sendVerificationEmail(email, rowsInsert.insertId, username);
                    // Return token
                    res.status(201).send({ token: jwt.sign({ id: rowsInsert.insertId }, process.env.ACCESS_TOKEN_SECRET), userUrl: userUrl, verifiedEmail: false, emailResponseCode: emailResponse.code, role: false });
                } else {
                    res.status(500).send({ message: 'Something went wrong while adding your account!' });
                }
            }
        }
    } catch (error) {
        console.error(error);
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
            const query = isValidEmail ? 'email' : 'username';
            const [rows, fields] = await db.getPromise().query(`SELECT id, url as userUrl, hashPassword, verifiedEmail, role FROM users WHERE ${query} = ?;`, [username]);
            if (rows.length === 1) {
                const hashedPassword = rows[0].hashPassword;
                const passwordMatch = await Bun.password.verify(password, hashedPassword);
                if (passwordMatch) {
                    res.status(200).send({ token: jwt.sign({ id: rows[0].id }, process.env.ACCESS_TOKEN_SECRET), userUrl: rows[0].userUrl, verifiedEmail: rows[0].verifiedEmail, role: rows[0].role });
                } else {
                    res.status(401).send({ message: 'Authentication failed', errorValues: { username, password } });
                }
            } else {
                res.status(401).send({ message: 'Authentication failed', errorValues: { username, password } });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Something went wrong during login!', errorCode: error });
    }
});

router.post('/login/google', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).send('No access_token sended!');
        }
        const googleUser = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
        if (!googleUser.ok) {
            return res.status(401).send('Invalid access_token!');
        }
        const googleUserData = await googleUser.json();
        const [rows, fields] = await db.getPromise().query('SELECT id, username, hashPassword, role, url as userUrl, verifiedEmail FROM users WHERE email = ?', [googleUserData.email]);
        if (rows.length === 1) {
            res.status(200).send({ token: jwt.sign({ id: rows[0].id }, process.env.ACCESS_TOKEN_SECRET), userUrl: rows[0].userUrl, verifiedEmail: rows[0].verifiedEmail, role: rows[0].role });
        } else {
            const username = googleUserData.email.split('@')[0];
            const userUrl = username.replace(/\s+/g, '_').toLowerCase();
            const [rowsInsert, fieldsInsert] = await db.getPromise().query(
                'INSERT INTO users (username, email, registerDate, url, profilePictureSrc, bannerPictureSrc, googleAccount, verifiedEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
                [username, googleUserData.email, new Date().toLocaleDateString('en-GB', dateOptions), userUrl, path.join(`uploads/defaultAvatars/${Math.floor(Math.random() * 6) + 1}.svg`), path.join(`uploads/defaultBanners/${Math.floor(Math.random() * 2) + 1}.svg`), true, true]
            );
            if (rowsInsert.affectedRows > 0) {
                res.status(201).send({ token: jwt.sign({ id: rowsInsert.insertId }, process.env.ACCESS_TOKEN_SECRET), userUrl, verifiedEmail: true, role: false });
            } else {
                res.status(500).send({ message: 'Something went wrong while adding your account!' });
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Something went wrong during login!', errorCode: error });
    }
});

router.post('/verifyEmail', verifyUserLogged, async (req, res, next) => {
    const [rows, fields] = await db.getPromise().query('SELECT email, username FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 1) {
        res.send(sendVerificationEmail(rows[0].email, req.userId, rows[0].username));
    } else {
        res.status(404).send({ message: 'User not found!', code: 404 });
    }
});

router.get('/verifyEmail/:code', async (req, res, next) => {
    const { code } = req.params;
    try {
        const decoded = jwt.verify(code, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.exp < Date.now() / 1000) {
            return res.status(400).send({ message: 'Token expired!', code: 400 });
        }
        const [rows, fields] = await db.getPromise().query("UPDATE users SET verifiedEmail = true WHERE id = ?", [decoded.id]);
        if (rows.affectedRows === 0) {
            res.status(500).send({ message: 'Error updating user!', code: 500 });
        }
        res.status(200).send({ message: 'Email verified!', code: 200 });
    } catch (err) {
        res.status(500).send({ message: 'Error verifying email!', error: err, code: 500 });
    }
});

//TODO add password recovery
router.post('/recoverPassword', async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send({ message: 'Email is required!', code: 400 });
    }
    try {
        const [rows, fields] = await db.getPromise().query('SELECT id, username FROM users WHERE email = ?', [email]);
        if (rows.length === 1) {
            const code = jwt.sign({ id: rows[0].id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            if (!code) {
                return res.status(500).send({ message: 'Error generating token!', error: err, code: 500 });
            }
            const { error } = resend.emails.send({
                from: "fundflow By Reasonable <noreply@fundflow.arcedo.dev>",
                to: [email],
                subject: `Recover Password for ${rows[0].username} - ${new Date().toLocaleDateString('en-GB', dateOptions)}`,
                text: 'Please verify your email address by clicking the link below',
                html: htmlRecoverPassword(code, rows[0].username),
            });
            if (error) {
                return res.status(500).send({ message: 'Error sending verification email!', error, code: 500 });
            }
            res.status(200).send({ message: 'Email sent!', code: 200 });
        }
        res.status(404).send({ message: 'User not found!', code: 404 });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Something went wrong during password recovery!', errorCode: error });
    }
});

router.put('/recoverPassword/:code', async (req, res, next) => {
    const { code } = req.params;
    const { password, confirmationPassword } = req.body;
    try {
        const decoded = jwt.verify(code, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.exp < Date.now() / 1000) {
            return res.status(400).send({ message: 'Token expired!', code: 400 });
        }
        if (!password || !confirmationPassword) {
            return res.status(400).send({ message: 'All fields are required!', code: 400 });
        }
        if (password !== confirmationPassword) {
            return res.status(400).send({ message: 'Passwords do not match!', code: 400 });
        }
        const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt' });
        const [rows, fields] = await db.getPromise().query("UPDATE users SET hashPassword = ?, googleAccount = false WHERE id = ?", [hashedPassword, decoded.id]);
        if (rows.affectedRows === 0) {
            res.status(500).send({ message: 'Error updating user!', code: 500 });
        }
        res.status(200).send({ message: 'Password updated!', code: 200 });
    } catch (err) {
        res.status(500).send({ message: 'Error recovering password!!', error: err, code: 500 });
    }
});
module.exports = router;