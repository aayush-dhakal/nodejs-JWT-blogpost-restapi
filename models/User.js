const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Post = require('./Post')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim:true,
        required: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('email is invalid')
            }
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('password cannot contain word password')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'owner' 
})

// here toJSON method will return the user from the routes with including password, tokens and avatar
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


// generating jwt token
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'secretsignature', { expiresIn: '7 days' })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// custom middleware using statics method for verifying user credentials. this can be directly called by User model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error("invalid email")
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('invalid password')
    }

    return user
}

// hashing the password before it's saved
// this is a middleware which runs before(pre) saving a user
userSchema.pre('save', async function(next){
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

// deleting user posts when user is removed
userSchema.pre('remove', async function(next) {
    const user = this

    await Post.deleteMany({ owner: user._id })    

    next()
})


// you have to set variable as Model name just like this inorder to get statics middleware to access User model. this single line export: module.exports = mongoose.model('User', userSchema) ain't gonna work
const User = mongoose.model('User', userSchema)

module.exports = User