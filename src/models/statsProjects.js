// ./src/models/statsProjects.js
import mongoose from 'mongoose';

const statsProjectSchema = new mongoose.Schema({
    idUser: { type: Number, required: true },
    idProject: { type: Number, required: true },
    likes: { type: Boolean, default: false },
    dislikes: { type: Boolean, default: false },
});

const StatsProjects = mongoose.model('StatsProject', statsProjectSchema);

export default StatsProjects;
