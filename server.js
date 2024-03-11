const express = require('express');
const cors = require('cors');
const db = require('./src/database/mySqlConnection');
const mongoose = require('mongoose');

// TODO: add morgan?, jest

const app = express();

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Port & host
const port = process.env.SERVER_PORT ?? 3001;
const host = process.env.SERVER_HOST ?? "http://localhost";
app.listen(port, () => console.log(`URL: ${host}:${port}`));

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
        console.log('Unable to connect to the database (MySQL):', err);
        process.exit(1);
    } else {
        db.get().query('SELECT NOW() as date;', function (err, rows) {
            if (err) {
                console.error('Unable to execute query to MySQL: ' + err);
                process.exit(1);
            } else {
                console.log(`MySQL: Connected to MySQL ${dbConfig.database} successfully\nDATE: ${rows[0]['date']}`);
            }
        });
    }
});

// Routes
const routes = require('./src/routes/routes');
app.use('/', routes);

// Import models
import ReviewsProjects from './src/models/reviewsProjects';
import SrcImages from './src/models/srcImages';
import StatsProjects from './src/models/statsProjects';

// Connect to MongoDB
try {
    mongoose.connect(process.env.MONGO_URL + '/fundflow');
    console.log('MongoDB: Connected to MongoDB fundflow successfully');
} catch (error) {
    console.error('Error connecting to MongoDB: ', error.stack);
}

// Create a new StatsProjects instance with valid idUser
// const statsProjects = new StatsProjects({
//     idUser: 1,
//     idProject: 1,
//     likes: 0,
//     shares: 0
// });

// statsProjects.save()
//     .then((result) => {
//         console.log(result);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// StatsProjects.find()
//     .then((data) => {
//         console.log('StatsProjects data for idUser 1:', data);
//     })
//     .catch((error) => {
//         console.error('Error retrieving StatsProjects data:', error);
//     });