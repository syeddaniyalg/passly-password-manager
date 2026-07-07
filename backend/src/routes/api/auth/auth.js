const express = require('express')
const { Users } = require('./../../../schemas/users.js')
const jwt = require('jsonwebtoken')
const authRouter = express.Router();
const bcrypt = require('bcrypt')

authRouter.post("/", async (req, res) => {
    const { method, ...credentials } = req.body
    let resData = {}
    let token = ''

    if (method == 'github') {
        const CLIENT_ID = process.env.GITHUB_CLIENT_ID
        const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
        const { code } = credentials
        const githubTokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code
            })
        }
        )

        const tokenRes = await githubTokenResponse.json();
        if ("error" in tokenRes) {
            return res.status(400).json({ success: false, error: 'Authentication Failed. Invalid code.' })
        }

        const TOKEN = tokenRes.access_token
        const profile_data = await (await fetch("https://api.github.com/user", {
            headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        })).json();

        resData = { success: true, name: profile_data.name }
        token = TOKEN
    }
    else if (method == 'regular') {
        const { username, password } = credentials
        const q_username = username.replace('@passly.com', '')
        const user = await Users.findOne({ username: q_username })

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (isMatch) {
                resData = { success: true, name: user['name'] }
                token = user['token']
            }
            else {
                return res.status(400).json({ success: false, error: 'Invalid username or password' })
            }
        }
        else {
            return res.status(400).json({ success: false, error: 'Invalid username or password' })
        }
    }
    else {
        return res.status(400).json({ success: false, error: 'Invalid method' })
    }

    const finalToken = jwt.sign(    
        {token: token},       
        process.env.JWT_KEY,       
        { expiresIn: '30m' }           
    );

    res.cookie('user_session', finalToken, {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    res.status(200).json(resData)
})

module.exports = { authRouter }