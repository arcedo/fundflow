const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const verifyUserLogged = require('../controllers/verifyUserLogged');
const verifyAdminRole = require('../controllers/verifyAdminRole');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/projects'); // specify the directory where you want to store uploaded files
    },
    filename: function (req, file, cb) {
        if (file) {
            // Extract the file extension
            const fileExtension = file.originalname.split('.').pop();
            const timestamp = Date.now(); // Get the current timestamp
            const newFileName = `project_${req.params.id}_img_blog_${timestamp}.${fileExtension}`;
            // Construct the new file name using the project ID and unique ID
            cb(null, newFileName);
        } else {
            cb(null, '');
        }
    }
});
const uploadImageBlog = multer({ storage });

// Schema
const ProjectsBlogs = require('../models/blogsProjects');


/**
 * @swagger
 * tags:
 *   - name: Project Blogs
 *     description: Operations related to project blogs
 * definitions:
 *   schemas:
 *     NewProjectBlog:
 *       type: object
 *       properties:
 *         idProject:
 *           type: number
 *         title:
 *           type: string
 *         content:
 *           type: string
 *       required: [idProject, title, content]
 *     ProjectBlog:
 *       type: object
 *       properties:
 *         _id:
 *           type: number
 *           description: The ID of the blog.
 *         idProject:
 *           type: number
 *           description: The ID of the project that the blog belongs to.
 *         title:
 *           type: string
 *           description: The title of the blog.
 *         content:
 *           type: string
 *           description: The content of the blog.
 *         creationDate:
 *           type: string
 *           format: date-time
 *           description: The creation date of the blog.
 */

/**
 * @swagger
 * /projects/{id}/blog:
 *   get:
 *     summary: Get project blogs
 *     tags:
 *       - Project Blogs
 *     description: Retrieve the blogs associated with a project.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the project to retrieve blogs for.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A list of blogs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/schemas/ProjectBlog'
 *       '404':
 *         description: No blogs found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/:id/blogs', async (req, res) => {
    try {
        const result = await ProjectsBlogs.find({ idProject: Number(req.params.id) }).sort({ creationDate: -1 });
        if (!result) {
            res.status(404).send({ message: 'No blogs found in these project', code: 404 });
        }
        res.status(200).send(result);
    } catch (error) {
        console.error('Error in GET /:id/blog route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.get('/:id/blogs/:idBlog/image', async (req, res) => {
    try {
        console.log(req.params.idBlog);
        console.log(req.params.id);
        const blog = await ProjectsBlogs.findOne({ idProject: Number(req.params.id), _id: req.params.idBlog });
        console.log(blog);
        if (!blog) {
            return res.status(404).send({ message: 'Blog not found' });
        }
        res.status(200).sendFile(path.join(__dirname, '..', '..', blog.srcImage));
    } catch (error) {
        console.error('Error in GET /:id/blog/:idBlog/image route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}/blog:
 *   post:
 *     summary: Create a new blog for a project
 *     tags:
 *       - Project Blogs
 *     description: Create a new blog post for a specific project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project to create the blog for
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: blogDetails
 *         description: Blog details including title and content
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProjectBlog'
 *     responses:
 *       '201':
 *         description: Blog created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. Title or content is missing.
 *       '500':
 *         description: Internal server error.
 */
router.post('/:id/blogs', verifyUserLogged, uploadImageBlog.single('image'), async (req, res) => {
    try {
        const userProject = await await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (userProject.length === 0) {
            return res.status(401).send({ message: 'Unauthorized' });
        }
        const { title, content } = req.body;
        // Validate required fields and their types/format if necessary
        if (!title || !content) {
            return res.status(400).send({ message: 'Title and content are required!', code: 400 });
        }
        // Save the blog in the database (MongoDB)
        const savedBlog = new ProjectsBlogs({
            idProject: Number(req.params.id),
            title: title,
            content: content,
            srcImage: req.file.path || null
        });
        savedBlog.save()
            .then((result) => {
                res.status(201).send({ result, code: 201 });
            })
            .catch((error) => {
                console.error('Error saving blog in MongoDB:', error);
                res.status(400).send({ message: 'Unable to create blog', code: 400 });
            });
    } catch (error) {
        console.error('Error in POST /:id/blog route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}/blog/{idBlog}:
 *   put:
 *     summary: Update a blog for a project by ID
 *     tags:
 *       - Project Blogs
 *     description: Update an existing blog post for a specific project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project that the blog belongs to
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: idBlog
 *         description: ID of the blog to update
 *         required: true
 *         schema:
 *           type: string
 *       - in: body
 *         name: blogDetails
 *         description: Updated blog details including title and content
 *         required: true
 *         schema:
 *           $ref: '#/definitions/schemas/NewProjectBlog'
 *     responses:
 *       '200':
 *         description: Blog updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '400':
 *         description: Bad request. Title or content is missing.
 *       '404':
 *         description: No blog found with the provided ID.
 *       '500':
 *         description: Internal server error.
 */
router.put('/:id/blogs/:idBlog', verifyUserLogged, async (req, res) => {
    try {
        const userProject = await await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        if (userProject.length === 0) {
            return res.status(401).send({ message: 'Unauthorized' });
        }
        const { title, content } = req.body;
        // Validate required fields and their types/format if necessary
        if (!title || !content) {
            return res.status(400).send({ error: 'Title and content are required!' });
        }
        // Update the blog in the database (MongoDB)
        const result = await ProjectsBlogs.updateOne(
            { idProject: req.params.id, _id: req.params.idBlog }, // Filter
            { $set: { title: title, content: content } } // Update
        );
        if (result.modifiedCount > 0) {
            res.status(200).send({ message: 'Blog updated successfully', id: req.params.idBlog });
        } else {
            res.status(404).send({ error: 'No blog found' });
        }
    } catch (error) {
        console.error('Error in PUT /:id/blog/:idBlog', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /projects/{id}/blog/{idBlog}:
 *   delete:
 *     summary: Delete a blog for a project by ID
 *     tags:
 *       - Project Blogs
 *     description: Delete an existing blog post for a specific project.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the project that the blog belongs to
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: idBlog
 *         description: ID of the blog to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Blog deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '404':
 *         description: No blog found with the provided ID.
 *       '500':
 *         description: Internal server error.
 */
router.delete('/:id/blogs/:idBlog', verifyUserLogged, verifyAdminRole, async (req, res) => {
    try {
        let rows;
        if (req.admin !== true) {
            rows = await await db.getPromise().query('SELECT id FROM projects WHERE id = ? AND idUser = ?', [req.params.id, req.userId]);
        }
        if (rows.length > 0 || req.admin === true) {
            const blog = await ProjectsBlogs.findOne({ idProject: Number(req.params.id), _id: req.params.idBlog });
            if (blog.srcImage) {
                const filePath = path.join(__dirname, '..', 'uploads', 'projects', blog.srcImage);
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
            const result = await ProjectsBlogs.deleteOne({ idProject: req.params.id, _id: req.params.idBlog });
            if (result.deletedCount > 0) {
                res.status(200).send({ message: 'Blog deleted successfully', code: 200 });
            } else {
                res.status(404).send({ message: 'No blog found', code: 404 });
            }
        } else {
            res.status(403).send({ message: 'Forbidden' });
        }
    } catch (error) {
        console.error('Error in DELETE /:id/blog/:idBlog route:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

module.exports = router;