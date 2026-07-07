const express = require('express');
const cors = require('cors')
const mongoose = require('mongoose')
const {authorize} = require('./src/middleware/auth/auth.js')
const {router} = require("./src/routes/routes.js")
const cookieParser = require('cookie-parser')


require('dotenv').config();
const app = express();
const PORT = process.env.PORT;


app.use(cors({ origin:  process.env.FRONTEND_URL, credentials: true}));
app.use(express.json())
app.use(cookieParser());

app.use('/', router)

async function connectDB()
{
    try
    {
        await mongoose.connect(process.env.LOCAL_MONGODB_URL)
        console.log("Database connected successfully!")
    }
    catch (error)
    {
        console.log(`Failed to connect.\nError:${error}`)
    }
}

app.listen(PORT, async () => {
    await connectDB()
    console.log(`App listening on port ${PORT}...`);
});