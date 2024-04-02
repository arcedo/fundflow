const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const blogsProjects = new Schema({
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

const BlogsProjects = model('BlogsProjects', blogsProjects);
export default BlogsProjects;
