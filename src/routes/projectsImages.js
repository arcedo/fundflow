const { Router } = require('express');
const router = Router();

// Schema
const SrcImages = require('../models/srcImages');

/**
 * @swagger
 * tags:
 *   - name: Project Images
 *     description: Operations related to project images
 * definitions:
 *   schemas:
 *     NewProjectImage:
 *       type: object
 *       properties:
 *         src:
 *           type: string
 *           format: uri
 *           description: The source URL of the image.
 *       required:
 *         - src
 */

/**
 * @swagger
 * /projects/{id}/image:
 *   post:
 *     summary: Upload a new image for a project
 *     tags:
 *       - Project Images
 *     description: Upload a new image for a specific project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to upload the image for
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: imageDetails
 *         description: Image details including source URL
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProjectImage'
 *     responses:
 *       '201':
 *         description: Image created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. Src is missing.
 *       '500':
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /projects/{id}/image/{idImage}:
 *   delete:
 *     summary: Delete a project image
 *     tags: [Project Images]
 *     description: Delete an image associated with a project.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the project that the image belongs to.
 *         schema:
 *           type: string
 *       - in: path
 *         name: idImage
 *         required: true
 *         description: The ID of the image to delete.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Image deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message.
 *       '404':
 *         description: No image found.
 *       '500':
 *         description: Internal server error.
 */
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