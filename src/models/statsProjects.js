// ./src/models/statsProjects.js
import mongoose from 'mongoose';

const statsProjectSchema = new mongoose.Schema({
    idUser: {
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

const StatsProjects = mongoose.model('StatsProject', statsProjectSchema);

export default StatsProjects;
