const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const srcImagesSchema = new Schema({
    srcImage: { type: String, required: true },
    idProject: { type: Number, required: true },
});

const SrcImages = model('SrcImages', srcImagesSchema);
export default SrcImages;
