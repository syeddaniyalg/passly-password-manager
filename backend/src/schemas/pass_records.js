const mongoose = require('mongoose')

const passRecordsSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    key_hash: {
        type: String,
        required: true
    },

    records: {
        type: [{
            title: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            password_hash: {
                type: String,
                required: true
            },
            data_created: {
                type: String,
                required: true
            },
            data_modified: {
                type: String,
                required: true
            },
            score:{
                type: Number,
                required: true
            }
        }],
        default: []
    },
})

const passRecords = mongoose.model('pass_records', passRecordsSchema)

module.exports = { passRecords }