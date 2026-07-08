const jwt = require('jsonwebtoken')
const authorize = (req, res, next)=>{
    const token = req.cookies.user_session;
    if (!token)
    {
        return res.status(400).json({auth: false, error: "Token Not Found"})
    }
    
    try {
        const decoded_token =  jwt.verify(token, process.env.JWT_KEY)
        req.body = {...req.body, auth: true, token: decoded_token.token, token_type: decoded_token.token_type}
        next()
    } catch (error) {
        return res.status(400).json({auth: false, error: "Token Invalid/Expired!"})
    }
}

module.exports = {authorize}