const mongoose = require('mongoose');

const { Schema, model } = mongoose;

// followsUserUrl is the user that follows another user
// userUrl is the user that is being followed
const userFollowsSchema = new Schema({
    userUrl: {
        type: String,
        required: true
    },
    followsUserUrl: {
        type: String,
        required: true
    }
});

const UserFollows = model('UserFollow', userFollowsSchema);

module.exports = UserFollows;