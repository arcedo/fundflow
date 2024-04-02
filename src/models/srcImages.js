const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const srcImagesSchema = new Schema({
    idProject: {
        type: Number,
        required: true
    },
    srcImage: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: () => Date.now()
    },
});

const SrcImages = model('SrcImages', srcImagesSchema);
export default SrcImages;
