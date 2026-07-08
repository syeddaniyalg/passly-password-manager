const express = require('express')
const apiRouter = express.Router()
const { authRouter } = require('./auth/auth.js')
const { authorize } = require('./../../middleware/auth/auth.js')
const { Users } = require("./../../schemas/users.js")
const { passRecords } = require("./../../schemas/pass_records.js")
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

apiRouter.use('/auth', authRouter)

apiRouter.post('/validate', async (req, res) => {
    const { username } = req.body
    const status = await Users.findOne({ username: username })

    if (status) {
        res.json({ validate: false })
    }
    else {
        res.json({ validate: true })
    }
})

apiRouter.post('/signup', async (req, res) => {
    const { firstname, lastname, username, password } = req.body
    const full_name = `${firstname} ${lastname}`
    const new_token = crypto.randomBytes(32).toString('hex')

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const SECRET_KEY = crypto.randomBytes(32).toString('hex')
    const hashedKey = await bcrypt.hash(SECRET_KEY, salt)

    const new_user = new Users({ name: full_name, username: username, password_hash: hashedPassword, token: new_token })
    const saved_user = await new_user.save()
    const new_record = new passRecords({ username: username, key_hash: hashedKey })
    const saved_record = await new_record.save()

    res.status(200).json({ success: true, key: SECRET_KEY })
})

apiRouter.post('/getname', authorize, async (req, res) => {
    const { auth, token, token_type } = req.body

    if (auth) {
        if (token_type == 'regular') {
            const user = await Users.findOne({ token: token })
            return res.status(200).json({ auth: true, name: user.name })
        }
        else {
            const profile_data = await (await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            })).json();

            return res.status(200).json({ auth: true, name: profile_data.name })
        }

    }
})

apiRouter.post('/verify_auth', authorize, async (req, res) => {
    const { check, auth, token } = req.body

    if (auth) {
        return res.status(200).json({ auth: true })
    }
})

apiRouter.post('/getlist', authorize, async (req, res) => {
    const { auth, token, token_type } = req.body

    if (auth) {
        if (token_type == 'regular') {
            const user = await Users.findOne({ token: token })
            const record = await passRecords.findOne({ username: user.username })
            return res.status(200).json({ success: true, items: record.records })
        }
        else {
            const profile_data = await (await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            })).json();

            const record = await passRecords.findOne({ username: profile_data.login })
            return res.status(200).json({ success: true, items: record.records })
        }
    }
})

apiRouter.post('/additem', authorize, async (req, res) => {
    // We assume `item` coming from the frontend looks like: 
    // { title: "...", email: "...", password: "...", score: 85 }
    const { item, key, token, token_type } = req.body

    try {
        let targetUsername;

        // 1. Resolve the user
        if (token_type === 'regular') {
            const user = await Users.findOne({ token: token })
            if (!user) return res.status(404).json({ success: false, message: "User not found" })
            targetUsername = user.username
        } else {
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            })
            const profile_data = await response.json()
            targetUsername = profile_data.login
        }

        // 2. Encrypt the password using JWT and the provided key
        const encryptedPassword = jwt.sign({ password: item.password }, key)

        // 3. Generate automatic timestamps
        const currentTimestamp = new Date().toISOString()

        // 4. Construct the schema object
        const newRecordData = {
            title: item.title,
            email: item.email,
            password_hash: encryptedPassword,
            data_created: currentTimestamp,
            data_modified: currentTimestamp,
            // Grab the score directly from the passed item
            score: item.score || 0
        }

        // 5. Atomic database push
        const updatedRecord = await passRecords.findOneAndUpdate(
            { username: targetUsername },
            { $push: { records: newRecordData } },
            { new: true, runValidators: true }
        )

        if (!updatedRecord) {
            return res.status(404).json({ success: false, message: "Record vault not found" })
        }

        return res.status(200).json({ success: true, items: updatedRecord.records })

    } catch (error) {
        console.error("Error in /additem:", error)
        return res.status(500).json({ success: false, message: "Server error while saving item" })
    }
})

apiRouter.post('/validatekey', authorize, async (req, res) => {
    const { key, token, token_type } = req.body

    try {
        let targetUsername;

        if (token_type === 'regular') {
            const user = await Users.findOne({ token: token })
            if (!user) return res.status(404).json({ success: false })
            targetUsername = user.username
        } else {
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            })
            const profile_data = await response.json()
            targetUsername = profile_data.login
        }

        const record = await passRecords.findOne({ username: targetUsername })

        if (!record || !record.key_hash) {
            return res.status(404).json({ success: false })
        }

        const isMatch = await bcrypt.compare(key, record.key_hash)

        if (isMatch) {
            return res.status(200).json({ success: true })
        } else {
            return res.status(401).json({ success: false })
        }

    } catch (error) {
        console.error("Error in /validatekey:", error)
        return res.status(500).json({ success: false })
    }
})

apiRouter.post('/decrypt-key', authorize, async (req, res) => {
    const { password_hash, key, auth, token, token_type } = req.body

    try {
        if (auth) {
            if (!password_hash || !key) {
                return res.status(400).json({ success: false, message: "Missing required fields" })
            }

            const decoded = jwt.verify(password_hash, key)

            return res.status(200).json({
                success: true,
                password: decoded.password
            })
        }
    } catch (error) {
        console.error("Error in /decrypt-key:", error)
        return res.status(401).json({ success: false, message: "Decryption failed or invalid key" })
    }
})

apiRouter.post('/update-item', authorize, async (req, res) => {
    const { item, key, token, token_type } = req.body;

    try {
        let targetUsername;

        // 1. Resolve the user
        if (token_type === 'regular') {
            const user = await Users.findOne({ token: token });
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            targetUsername = user.username;
        } else {
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });
            const profile_data = await response.json();
            targetUsername = profile_data.login;
        }

        // 2. Encrypt the updated password using JWT and the provided key
        const encryptedPassword = jwt.sign({ password: item.password }, key);
        const currentTimestamp = new Date().toISOString();

        // 3. Atomic database update for specific subdocument (requires item._id)
        const updatedRecord = await passRecords.findOneAndUpdate(
            { username: targetUsername, "records._id": item._id },
            {
                $set: {
                    "records.$.title": item.title,
                    "records.$.email": item.email,
                    "records.$.password_hash": encryptedPassword,
                    "records.$.score": item.score || 0,
                    "records.$.data_modified": currentTimestamp
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ success: false, message: "Record vault or item not found" });
        }

        return res.status(200).json({ success: true, items: updatedRecord.records });

    } catch (error) {
        console.error("Error in /update-item:", error);
        return res.status(500).json({ success: false, message: "Server error while updating item" });
    }
});

apiRouter.post('/deleteItem', authorize, async (req, res) => {
    const { item, token, token_type } = req.body;

    try {
        let targetUsername;

        // 1. Resolve the user
        if (token_type === 'regular') {
            const user = await Users.findOne({ token: token });
            if (!user) return res.status(404).json({ success: false, message: "User not found" });
            targetUsername = user.username;
        } else {
            const response = await fetch("https://api.github.com/user", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });
            const profile_data = await response.json();
            targetUsername = profile_data.login;
        }

        // 2. Atomic database pull (removes the item from the records array by _id)
        const updatedRecord = await passRecords.findOneAndUpdate(
            { username: targetUsername },
            { $pull: { records: { _id: item._id } } },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ success: false, message: "Record vault or item not found" });
        }

        return res.status(200).json({ success: true, items: updatedRecord.records });

    } catch (error) {
        console.error("Error in /deleteItem:", error);
        return res.status(500).json({ success: false, message: "Server error while deleting item" });
    }
});

module.exports = { apiRouter }