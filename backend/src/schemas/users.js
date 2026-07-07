const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password_hash: {type: String, required: true},
    token: {type: String}
})

const Users = mongoose.model('User', userSchema)
module.exports = {Users}

