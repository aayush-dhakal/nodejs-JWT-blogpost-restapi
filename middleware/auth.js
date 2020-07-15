const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'secretsignature')
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if(!user){
            throw new Error()
        }

        req.user = user
        req.token = token  // this is used by logout route to delete the particular logged in token

        next()

    } catch (error) {
        res.status(401).send({ error: "please authenticate" })
    }
}

module.exports = auth