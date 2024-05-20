const { Router } = require('express');
const router = Router();
const fs = require('fs');
const db = require('../database/mySqlConnection');
const path = require('path');
const multer = require('multer');

const TiersProjects = require('../models/tiersProjects');

const verifyUserLogged = require('../controllers/verifyUserLogged');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/projects'); // specify the directory where you want to store uploaded files
    },
    filename: function (req, file, cb) {
        // Extract the file extension
        const fileExtension = file.originalname.split('.').pop();
        const timestamp = Date.now(); // Get the current timestamp
        const newFileName = `project_${req.params.id}_img_tier_${timestamp}.${fileExtension}`;
        // Construct the new file name using the project ID and unique ID
        cb(null, newFileName);
    }
});
const uploadTierImage = multer({ storage });

router.get('/:id/tiers', async (req, res) => {
    try {
        const tiers = await TiersProjects.find({ idProject: Number(req.params.id) });
        if (!tiers) {
            return res.status(404).send({ message: 'Tiers not found', code: 404 });
        }
        res.status(200).send(tiers);
    } catch (error) {
        console.error('Error in /:id/tiers route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/:id/tiers/:idTier/image', async (req, res) => {
    try {
        const tier = await TiersProjects.findOne({ _id: req.params.idTier });
        if (!tier) {
            return res.status(404).send({ message: 'Tier not found', code: 404 });
        }
        res.status(200).sendFile(path.join(__dirname, '..', '..', tier.srcImage));
    } catch (error) {
        console.error('Error in /:id/tiers/:idTier/image route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.post('/:id/tiers', verifyUserLogged, uploadTierImage.single('image'), async (req, res) => {
    try {
        const { description, price, title } = req.body;
        if (!description || !price || !title) {
            return res.status(400).send({ message: 'description, price and srcImage are required' });
        }
        const [rows, fields] = await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (rows.length === 0) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        const tier = new TiersProjects({
            idProject: Number(req.params.id),
            title,
            description,
            price,
            srcImage: req.file.path || null
        });
        const result = await tier.save();
        if (!result) {
            return res.status(400).send({ message: 'Unable to create tier', code: 400 });
        }
        res.status(201).send({ result, code: 201 });
    } catch (error) {
        console.error('Error in POST /:id/tiers route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.put('/:id/tiers/:idTier', verifyUserLogged, uploadTierImage.single('image'), async (req, res) => {
    try {
        const { description, price, title } = req.body;
        if (!description || !price || !title) {
            return res.status(400).send({ message: 'description, price and srcImage are required' });
        }
        const [rows, fields] = await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (rows.length === 0) {
            return res.status(403).send({ message: 'Forbidden' });
        }
        const tier = await TiersProjects.findOne({ _id: req.params.idTier });
        if (!tier) {
            return res.status(404).send({ message: 'Tier not found', code: 404 });
        }
        if (tier.srcImage && req.file) {
            fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'projects', tier.srcImage));
        }
        tier.title = title || tier.title;
        tier.description = description || tier.description;
        tier.price = price || tier.price;
        tier.srcImage = req.file ? req.file.path : tier.srcImage;
        const result = await tier.save();
        if (!result) {
            return res.status(400).send({ message: 'Unable to update tier', code: 400 });
        }
        res.status(200).send({ result, code: 200 });
    } catch (error) {
        console.error('Error in PUT /:id/tiers/:idTier route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.delete('/:id/tiers/:idTier', verifyUserLogged, async (req, res) => {
    try {
        const [rows, fields] = await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (rows.length === 0) {
            return res.status(403).send({ message: 'Forbidden' });
        }

        const tier = await TiersProjects.findOne({ _id: req.params.idTier });
        if (!tier) {
            return res.status(404).send({ message: 'Tier not found', code: 404 });
        }

        if (tier.srcImage) {
            const filePath = path.join(__dirname, '..', 'uploads', 'projects', tier.srcImage);
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting file:', err);
                        }
                    });
                } else {
                    console.warn('File does not exist, skipping deletion:', filePath);
                }
            });
        }

        await TiersProjects.deleteOne({ _id: req.params.idTier });
        res.status(200).send({ message: 'Tier deleted successfully', code: 200 });
    } catch (error) {
        console.error('Error in DELETE /:id/tiers/:idTier route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;