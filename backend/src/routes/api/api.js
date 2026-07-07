const express = require('express')
const apiRouter = express.Router()
const {authRouter} = require('./auth/auth.js')
const {authorize} = require('./../../middleware/auth/auth.js')
const {Users} = require("./../../schemas/users.js")
const crypto = require('crypto')
const bcrypt = require('bcrypt')

apiRouter.use('/auth', authRouter)

apiRouter.post('/validate', async (req, res)=>{
    const {username} = req.body
    const status = await Users.findOne({username: username})

    if (status)
    {
        res.json({validate: false})
    }
    else
    {
        res.json({validate: true})
    }
})

apiRouter.post('/signup', async (req, res)=>{
    const {firstname, lastname, username, password} = req.body
    const full_name = `${firstname} ${lastname}`
    const new_token = crypto.randomBytes(32).toString('hex')
   
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const new_user = new Users({name: full_name, username: username, password_hash: hashedPassword, token: new_token})
    const saved_user = await new_user.save()

    res.status(200).json({success:true})
})

apiRouter.post('/getname', authorize, async(req,res)=>{
    const {auth, token} = req.body

    if (auth)
    {
        const user = await Users.findOne({token: token})
        return res.status(200).json({auth: true, name:user.name})
    }
})

apiRouter.post('/verify_auth', authorize, async(req, res)=>{
    const {check, auth, token} = req.body

    if (auth)
    {
        return res.status(200).json({auth: true})
    }
})

module.exports = {apiRouter}