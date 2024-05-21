function validateQueryParams(req, res, next) {
    const startIndex = parseInt(req.query.startIndex, 10);
    const limit = parseInt(req.query.limit, 10);
    if (isNaN(startIndex) || isNaN(limit) || startIndex < 0 || limit <= 0) {
        return res.status(400).send({ message: 'startIndex and limit query parameters are required and must be valid numbers' });
    } else {
        // Store the validated values in the request object
        req.startIndex = startIndex;
        req.limit = limit;
        next();
    }
}

module.exports = validateQueryParams;