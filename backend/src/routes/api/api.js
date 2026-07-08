const express = require('express')
const apiRouter = express.Router()
const { authRouter } = require('./auth/auth.js')
const { authorize } = require('./../../middleware/auth/auth.js')
const { Users } = require("./../../schemas/users.js")
const { passRecords } = require("./../../schemas/pass_records.js")
const crypto = require('crypto')
const bcrypt = require('bcrypt')

const ENCRYPTION_SALT = 'vault_master_salt_v1'; 

const encryptPassword = (plainPassword, secretKey) => {

    const derivedKey = crypto.scryptSync(secretKey, ENCRYPTION_SALT, 32);
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    
    let encrypted = cipher.update(plainPassword, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

const decryptPassword = (encryptedString, secretKey) => {
    const derivedKey = crypto.scryptSync(secretKey, ENCRYPTION_SALT, 32);
    
    const parts = encryptedString.split(':');
    if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag); 
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

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
    const { item, key, token, token_type } = req.body

    try {
        let targetUsername;

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

        const encryptedPassword = encryptPassword(item.password, key)

        const currentTimestamp = new Date().toISOString()

        const newRecordData = {
            title: item.title,
            email: item.email,
            password_hash: encryptedPassword,
            data_created: currentTimestamp,
            data_modified: currentTimestamp,
            score: item.score || 0
        }

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

            const plainPassword = decryptPassword(password_hash, key)

            return res.status(200).json({
                success: true,
                password: plainPassword
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

        const encryptedPassword = encryptPassword(item.password, key);
        
        const currentTimestamp = new Date().toISOString();

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