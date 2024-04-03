const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const blogsProjectsSchema = new Schema({
    idProject: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creationDate: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
});

const BlogsProjects = model('BlogsProjects', blogsProjectsSchema);

module.exports = BlogsProjects;