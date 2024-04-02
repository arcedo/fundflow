const { Router } = require('express');
const router = Router();

//TODO: test if the user is logged in for all the routes that do an administrative action

// Schema
const ProjectsBlogs = require('../models/projectsBlogs');


router.get('/:id/blog', async (req, res) => {
    try {
        const result = await ProjectsBlogs.find({ idProject: req.params.id }).sort({ creationDate: -1 });
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /:id/blog route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.post('/:id/blog', async (req, res) => {
    try {
        const { title, content } = req.body;
        // Validate required fields and their types/format if necessary
        if (!title || !content) {
            return res.status(400).send({ error: 'Title and content are required!' });
        }
        // Save the blog in the database (MongoDB)
        const savedBlog = new ProjectsBlogs({
            idProject: req.params.id,
            title: title,
            content: content
        });
        savedBlog.save()
            .then((result) => {
                res.status(201).send({ message: 'Blog created successfully' });
            })
            .catch((error) => {
                console.error('Error saving blog in MongoDB:', error);
                res.status(400).send({ error: 'Unable to create blog' });
            });
    } catch (error) {
        console.error('Error in POST /:id/blog route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.put('/:id/blog/:idBlog', async (req, res) => {
    try {
        const { title, content } = req.body;
        // Validate required fields and their types/format if necessary
        if (!title || !content) {
            return res.status(400).send({ error: 'Title and content are required!' });
        }
        // Update the blog in the database (MongoDB)
        const result = await ProjectsBlogs.updateOne({ idProject: req.params.id, _id: req.params.idBlog }, { title: title, content: content });
        if (result.nModified > 0) {
            res.status(200).send({ message: 'Blog updated successfully' });
        } else {
            res.status(404).send({ error: 'No blog found' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/blog/:idBlog', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.delete('/:id/blog/:idBlog', async (req, res) => {
    try {
        const result = await ProjectsBlogs.deleteOne({ idProject: req.params.id, _id: req.params.idBlog });
        if (result.deletedCount > 0) {
            res.status(200).send({ message: 'Blog deleted successfully' });
        } else {
            res.status(404).send({ error: 'No blog found' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id/blog/:idBlog route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

module.exports = router;