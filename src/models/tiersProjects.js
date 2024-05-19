const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const tiersProjectSchema = new Schema({
    idProject: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    srcImage: {
        type: String,
        required: true
    }
});

const TiersProjects = model('tiersProjects', tiersProjectSchema);