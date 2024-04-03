const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const reviewsProjectsSchema = new Schema({
    idUser: {
        type: Number,
        required: true
    },
    idProject: {
        type: Number,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    rating: {
        type: Boolean,
        required: true
    },
    creationDate: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
});

const ReviewsProjects = model('ReviewsProjects', reviewsProjectsSchema);

module.exports = ReviewsProjects;
