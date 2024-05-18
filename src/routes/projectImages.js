const { Router } = require('express');
const router = Router();
const fs = require('fs');
const path = require('path');
const db = require('../database/mySqlConnection');

const verifyUserLogged = require('../controllers/verifyUserLogged');
const verifyAdminRole = require('../controllers/verifyAdminRole');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/projects'); // specify the directory where you want to store uploaded files
    },
    filename: function (req, file, cb) {
        // Extract the file extension
        const fileExtension = file.originalname.split('.').pop();
        const timestamp = Date.now(); // Get the current timestamp
        const newFileName = `project_${req.params.id}_img_${timestamp}.${fileExtension}`;
        // Construct the new file name using the project ID and unique ID
        cb(null, newFileName);
    }
});
const upload = multer({ storage });

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

router.get('/:id/image/:img', async (req, res) => {
    const projectImg = await SrcImages.find({ idProject: req.params.id, _id: req.params.img });
    if (projectImg.length > 0) {
        res.status(200).sendFile(path.join(__dirname, '../../', projectImg[0].src));
    } else {
        res.status(404).send({ message: 'No images found' });
    }
});

router.get('/:id/srcImages', async (req, res) => {
    const projectImgsSrc = await SrcImages.find({ idProject: req.params.id });
    if (projectImgsSrc.length > 0) {
        res.status(200).send(projectImgsSrc);
    } else {
        res.status(404).send({ message: 'No images found' });
    }
});

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
router.post('/:id/image', verifyUserLogged, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'Image is missing', code: 400 });
        }
        const verifyExistingProject = await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (verifyExistingProject.length > 0) {
            // Save the image source in the database (MongoDB)
            const currentImages = await SrcImages.find({ idProject: req.params.id });
            if (currentImages.length >= 4) {
                res.status(400).send({ message: 'Maximum number of images reached', code: 400 });
            } else {
                const savedImgSrc = new SrcImages({
                    idProject: req.params.id,
                    src: req.file.path
                });
                savedImgSrc.save()
                    .then((result) => {
                        res.status(201).send({ message: 'Image created successfully', id: result._id });
                    })
                    .catch((error) => {
                        console.error('Error saving image source in MongoDB:', error);
                        res.status(400).send({ message: 'Unable to create image', code: 400 });
                    });
            }
        } else {
            res.status(403).send({ message: 'Forbidden' });
        }
    } catch (error) {
        console.error('Error in POST /:id/image route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
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
router.delete('/:id/image/', verifyUserLogged, verifyAdminRole, async (req, res) => {
    try {
        let rows;
        if (req.admin !== true) {
            rows = await await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        }
        if (rows.length > 0 || req.admin === true) {
            const result = await SrcImages.deleteOne({ idProject: req.params.id, src: req.body.src });
            if (result.deletedCount > 0) {
                fs.unlinkSync(req.body.src);
                res.status(200).send({ message: 'Image deleted successfully' });
            } else {
                res.status(404).send({ message: 'No image found' });
            }
        } else {
            res.status(403).send({ message: 'Forbidden' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id/image/:id route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;