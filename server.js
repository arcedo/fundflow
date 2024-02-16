const express = require('express');
const cors = require('cors');
const db = require('./src/database/mySqlConnection');
//TODO: add moongose, morgan?, swagger, jest

const app = express();

// Configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Database configuration/connection
const dbConfig = {
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ?? 3306,
    user: process.env.DB_USER ?? 'fundflow',
    password: process.env.DB_PASSWORD ?? 'y0uNever$ee4CumM4n',
    database: process.env.DB_NAME ?? 'fundflow',
}

db.connect(dbConfig, (err) => {
    if (err) {
        console.log('Unable to connect to the database:', err);
        process.exit(1);
    } else {
        db.get().query('SELECT NOW() as date;', function (err, rows) {
            if (err) {
                console.error('Unable to execute query to MySQL: ' + err);
                process.exit(1);
            } else {
                console.log(`DATA_BASE: Connected to MySQL ${dbConfig.database} successfully\nDATE: ${rows[0]['date']}`);
            }
        });
    }
});

// Routes
const routes = require('./src/routes/routes');
app.use('/', routes);

// Port & host
const port = process.env.SERVER_PORT ?? 3001;
const host = process.env.SERVER_HOST ?? "http://localhost";
app.listen(port, () => console.log(`URL: ${host}:${port}`));

module.exports = app;