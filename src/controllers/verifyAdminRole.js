const db = require('../database/mySqlConnection');

async function verifyAdminRole(req, res, next) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            const [rows, fields] = await db.getPromise().query('SELECT role FROM users WHERE id = ?', [req.userId]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            } else if (rows[0].role != true) {
                req.admin = false;
            } else {
                req.admin = true;
            }
            next();
        };
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', errorCode: err });
    }
}

module.exports = verifyAdminRole;