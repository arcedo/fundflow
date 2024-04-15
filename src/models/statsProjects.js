// ./src/models/statsProjects.js
const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const statsProjectSchema = new Schema({
    idUser: {
        type: Number,
        required: true
    },
    idCategory: {
        type: Number,
        required: true
    },
    idProject: {
        type: Number,
        required: true
    },
    view: {
        type: Boolean,
        default: false
    },
    like: {
        type: Boolean,
        default: false
    },
    dislike: {
        type: Boolean,
        default: false
    },
    funded: {
        type: Number,
        default: 0
    },
    collaborator: {
        type: Boolean,
        default: false
    }
});

const StatsProjects = model('StatsProject', statsProjectSchema);

export default StatsProjects;
