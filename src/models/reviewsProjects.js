const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const reviewsProjectsSchema = new Schema({
    idReviewingUser: { type: Number, required: true },
    idReviewedProject: { type: Number, required: true },
    body: { type: String, required: true },
    rating: { type: Number, required: true },
});

const ReviewsProjects = model('ReviewsProjects', reviewsProjectsSchema);
export default ReviewsProjects;
