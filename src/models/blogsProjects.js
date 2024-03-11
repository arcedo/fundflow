const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const blogsProjects = new Schema({
    idProject: { type: Number, required: true },
    content: { type: String, required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const BlogsProjects = model('BlogsProjects', blogsProjects);
export default BlogsProjects;
