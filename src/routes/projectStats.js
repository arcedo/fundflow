const { Router } = require('express');
const router = Router();
//TODO: Swagger documentation
const StatsProjects = require('../models/statsProjects');

router.get('/:id/stats', async (req, res) => {
    try {
        const stats = await StatsProjects.find({ idProject: req.params.id });
        if (stats.length > 0) {
            res.status(200).send(stats);
        } else {
            res.status(404).send({ message: 'No stats found' });
        }
    } catch (error) {
        console.error('Error in /:id/stats route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.post('/:id/stats', async (req, res) => {
    if (!req.userId) {
        return res.status(401).send({ message: 'Unauthorized' });
    }
    try {
        const { idProject, idCategory } = req.body;
        if (!idProject || !idCategory) {
            return res.status(400).send({ message: 'idProject and idCategory are required' });
        }
        const userViewed = await StatsProjects.findOne({ idUser: req.userId, idProject, idCategory });
        if (userViewed) {
            return res.status(400).send({ message: 'User already viewed this project' });
        } else {
            const stats = new StatsProjects({
                idUser: req.userId,
                idProject,
                idCategory,
                view: true
            });
            const result = await stats.save();
            res.status(201).send(result);
        }
    } catch (error) {
        console.error('Error in POST /:id/stats route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.put('/:id/stats', async (req, res) => {
    const { idUser, idProject, evaluation, fund, collaboration } = req.body;
    if (!idUser || !idProject || !evaluation) {
        return res.status(400).send({ message: 'idUser, idProject, evaluation, fund or collaboration are required' });
    }
    try {
        const stats = await StatsProjects.findOne({ idUser, idProject });
        if (!stats) {
            return res.status(404).send({ message: 'Stats not found' });
        }
        if (evaluation === 'like') {
            stats.like = true;
            stats.dislike = false;
        } else if (evaluation === 'dislike') {
            stats.like = false;
            stats.dislike = true;
        }
        if (fund) {
            stats.funded = fund;
        }
        if (collaboration) {
            stats.collaborator = collaboration;
        }
        const result = await stats.save();
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in PUT /:id/stats route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

router.get('/categoryViewPercentage', async (req, res) => {
    try {
        const result = await StatsProjects.aggregate([
            {
                $group: {
                    _id: "$idCategory",
                    views: { $sum: { $cond: [{ $eq: ["$view", true] }, 1, 0] } }
                }
            },
            {
                $project: {
                    idCategory: "$_id",
                    views: 1,
                    _id: 0
                }
            }
        ]);
        if (result.length > 0) {
            let totalViews = map((category) => category.views, result).reduce((acc, curr) => acc + curr, 0);

            let categoriesPercentage = [];
            result.forEach(category => {
                const percentage = (category.views / totalViews) * 100;
                categoriesPercentage.push({
                    idCategory: category.idCategory,
                    percentage: percentage.toFixed(2)
                });
            });

            res.status(200).send(categoriesPercentage);
        } else {
            res.status(404).send({ message: 'No projects found' });
        }
    } catch (error) {
        console.error('Error in /categoryViewPercentage route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;