'use strict';

const express = require('express');
const app = express();

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const srcRoutes = './src/routes/';

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            version: '0.1',
            title: 'fundflow API',
            description: 'API for FundFlow project',
            contact: {
                email: "arcedo.marc@gmail.com"
            },
            license: {
                name: 'MIT License',
                url: 'https://opensource.org/license/mit/'
            },
            servers: [process.env.SERVER_HOST + ':' + process.env.SERVER_PORT]
        }
    },
    // APIs to document
    apis: [
        srcRoutes + 'auth.js',
        srcRoutes + 'projects.js'
    ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

module.exports = app;