const express = require('express')
const User = require('../models/User')
const bcrypt  = require('bcryptjs')
const router = new express.Router()
const auth = require('../middleware/auth')

router.post('/', async (req, res) => {
    // check if email is already registered
    let existedUser = await User.findOne({
        email: req.body.email
    })
    if (existedUser) return res.status(400).send({
        "msg": "email already registered"
    })

    // create new user
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({
            user,
            token
        })
    } catch (error) {
        res.status(400).send(error)
    }
})

// router.post('/login', async (req, res) => {
//     try {
//         const user = await User.findOne({
//             email: req.body.email
//         })

//         if (!user) {
//             // throw new Error('invalid email')
//             return res.status(400).send({"msg": "invalid email"})
//         }

//         const isMatch = await bcrypt.compare(req.body.password, user.password)

//         if (!isMatch) {
//             return res.status(400).send({"msg": "invalid password"})
//         }
//         res.send(user)

//     } catch (error) {
//         res.status(400).send(error)
//     }
// })

router.post('/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({ user, token })
    }
    catch(e){
        res.status(400).send()
    }   
})

router.post('/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

        await req.user.save()

        res.send()
    }
    catch(e){
        res.status(500).send()
    }   
})

// logout user from all devices(ie remove all the tokens related to that user)
router.post('/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []

        await req.user.save()

        res.send()
    }
    catch(e){
        res.status(500).send()
    }
})

// read own profile
router.get('/me', auth, async (req, res) => {
        res.send(req.user)    
})

router.patch('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'invalid update'
        })
    }

    try {
        // // this findByIdAndUpdate query bypasses the User model middleware
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        updates.forEach(update => req.user[update] = req.body[update])

        await req.user.save()

        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/me', auth, async (req, res) => {
    try {
        // user is returned from auth middleware on req object. And since user is already validated we can refactor the code 
        // const user = await User.findByIdAndDelete(req.user._id)

        // if (!user) {
        //     return res.status(404).send()
        // }

        await req.user.remove()

        res.send(req.user)
    } catch (error) {
        res.send(500).send()
    }
})

module.exports = router