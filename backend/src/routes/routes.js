const express = require('express')
const router = express.Router()
const {apiRouter} = require('./api/api.js')

router.use('/api', apiRouter)

module.exports = {router}