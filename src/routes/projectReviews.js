const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');

const verifyUserLogged = require('../controllers/verifyUserLogged');

const StatsProjects = require('../models/statsProjects');

router.get('/:id/reviews', async (req, res) => {
    try {
        const reviews = await StatsProjects.find({ idProject: Number(req.params.id) });
        if (!reviews) {
            return res.status(404).send({ message: 'Reviews not found', code: 404 });
        }
        res.status(200).send(reviews);
    } catch (error) {
        console.error('Error in /:id/reviews route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/byUser/reviewing', verifyUserLogged, async (req, res) => {
    try {
        const reviews = await StatsProjects.find({ idUser: req.user.id });
        if (!reviews) {
            return res.status(404).send({ message: 'Reviews not found', code: 404 });
        }
        res.status(200).send(reviews);
    }
    catch (error) {
        console.error('Error in /byUser/reviewing route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/byUser/reviewed', verifyUserLogged, async (req, res) => {
    try {
        const reviews = await StatsProjects.find({ idProjectCreator: req.user.id });
        if (!reviews) {
            return res.status(404).send({ message: 'Reviews not found', code: 404 });
        }
        res.status(200).send(reviews);
    }
    catch (error) {
        console.error('Error in /byUser/reviewed route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.post('/:id/reviews', verifyUserLogged, async (req, res) => {
    try {
        const { body, rating } = req.body;
        if (!body || !rating) {
            return res.status(400).send({ message: 'Missing required fields', code: 400 });
        }
        const newReview = new StatsProjects({
            idUser: req.user.id,
            idProject: Number(req.params.id),
            body,
            rating,
        });
        await newReview.save();
        res.status(201).send(newReview);
    } catch (error) {
        console.error('Error in /:id/reviews route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.delete('/:id/reviews/:idReview', verifyUserLogged, async (req, res) => {
    try {
        const review = await StatsProjects.findOne({ _id: req.params.idReview });
        if (!review) {
            return res.status(404).send({ message: 'Review not found', code: 404 });
        }
        if (review.idUser !== req.user.id) {
            return res.status(403).send({ message: 'Forbidden', code: 403 });
        }
        await StatsProjects.deleteOne({ _id: req.params.idReview });
        res.status(204).send();
    } catch (error) {
        console.error('Error in DELETE /:id/reviews/:idReview route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;