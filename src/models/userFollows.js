const mongoose = require('mongoose');

const { Schema, model } = mongoose;

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