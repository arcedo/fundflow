const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());
const port = process.env.SERVER_PORT || 3001;
const host = process.env.SERVER_HOST || "http://localhost";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});
//Port
app.listen(port, () => console.log(`Listening on port ${port}!\nURL: ${host}:${port}`));

module.exports = app;