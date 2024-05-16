const { Router } = require('express');
const router = Router();
const db = require('../database/mySqlConnection');
const verifyUserLogged = require('../controllers/verifyUserLogged');

const UserFollows = require('../models/userFollows');

// followsUserUrl is the user that follows another user
// userUrl is the user that is being followed
router.post('/follow', verifyUserLogged, async (req, res) => {
    try {
        const follow = new UserFollows({ userUrl: req.body.userUrl, followsUserUrl: req.body.followUserUrl });
        await follow.save();
        res.status(201).send({ message: 'Followed successfully', code: 201 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

router.delete('/unfollow', verifyUserLogged, async (req, res) => {
    try {
        const follow = await UserFollows.deleteOne({ userUrl: req.body.userUrl, followsUserUrl: req.body.followUserUrl });
        if (follow.deletedCount === 0) {
            return res.status(404).send({ message: 'User is not following', code: 404 });
        }
        res.status(200).send({ message: 'Unfollowed successfully', code: 200 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// userUrl is the user that is being followed
router.get('/:userUrl/followers', verifyUserLogged, async (req, res) => {
    try {
        const followers = await UserFollows.find({ userUrl: req.params.userUrl });
        res.status(200).send(followers.map(follow => follow.followsUserUrl));
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// followsUserUrl is the user that follows another user
router.get('/:userUrl/following', verifyUserLogged, async (req, res) => {
    try {
        const following = await UserFollows.find({ followsUserUrl: req.params.userUrl });
        res.status(200).send(following.map(follow => follow.userUrl));
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

router.get('/:followUserUrl/isFollowing/:userUrl', verifyUserLogged, async (req, res) => {
    try {
        const follow = await UserFollows.findOne({ userUrl: req.params.userUrl, followsUserUrl: req.params.followUserUrl });
        if (!follow) {
            return res.status(404).send({ message: 'User is not following', code: 404 });
        }
        res.status(200).send({ message: 'User is following', code: 200 });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

router.get('/')

module.exports = router;