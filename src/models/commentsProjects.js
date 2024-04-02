const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const commentsProjects = new Schema({
    idProject: {
        type: Number,
        required: true
    },
    idUser: {
        type: Number,
        required: true
    },
    replyTo: {
        type: Number,
        required: false
    },
    content: {
        type: String,
        required: true
    },
    creationDate: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
});

const CommentsProjects = model('CommentsProjects', commentsProjects);
export default CommentsProjects;