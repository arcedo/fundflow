const { Router } = require('express');
const router = Router();

// Schema
const SrcImages = require('../models/srcImages');

router.post('/:id/image', async (req, res) => {
    try {
        const { src } = req.body;
        // Validate required fields and their types/format if necessary
        if (!src) {
            return res.status(400).send({ error: 'Src is required!' });
        }
        // Save the image source in the database (MongoDB)
        const savedImgSrc = new SrcImages({
            idProject: req.params.id,
            src: src
        });
        savedImgSrc.save()
            .then((result) => {
                res.status(201).send({ message: 'Image created successfully' });
            })
            .catch((error) => {
                console.error('Error saving image source in MongoDB:', error);
                res.status(400).send({ error: 'Unable to create image' });
            });
    } catch (error) {
        console.error('Error in POST /:id/image route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.delete('/:id/image/:idImage', async (req, res) => {
    try {
        const result = await SrcImages.deleteOne({ idProject: req.params.id, _id: req.params.idImage });
        if (result.deletedCount > 0) {
            res.status(200).send({ message: 'Image deleted successfully' });
        } else {
            res.status(404).send({ error: 'No image found' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id/image/:id route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;