async function verifyUserLogged(req, res, next) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            next();
        };
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error', errorCode: err });
    }
};

module.exports = verifyUserLogged;