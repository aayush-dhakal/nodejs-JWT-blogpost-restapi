const express = require('express')
const Post = require('../models/Post')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/', auth, async (req, res) => {
    const post = new Post({
        ...req.body,
        owner: req.user._id
    })

    try {
        await post.save()
        res.status(201).send(post)
    } catch (error) {
        res.status(400).send(error)
    }
})

// get all posts without authentication
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({})
        res.send(posts)
    } catch (error) {
        res.status(500).send()
    }
})

// get all posts of the autheticated user
router.get('/all', auth, async (req, res) => {
    try {
        // const posts = await Post.find({ owner: req.user._id })
        // res.send(posts) 

        // or
        // basically populating(adding) the virtual posts field with the authorized user's posts
        await req.user.populate('posts').execPopulate()
        res.send(req.user.posts)

    } catch (error) {
        res.status(500).send()
    }
})

// get a particular post by id
router.get('/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const post = await Post.findOne({ _id, owner: req.user._id })

        if(!post) return res.status(404).send({"msg": "post not found"})

        res.send(post)

    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title','description']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({ error: 'invalid updates' })
    }

    try {
        const post = await Post.findOne({ _id: req.params.id, owner: req.user._id })

        if(!post) return res.status(404).send()

        updates.forEach(update => post[update] = req.body[update])

        await post.save()

        res.send(post)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if(!post) {
            return res.status(404).send()
        }

        res.send(post)
    } catch (error) {
        res.send(500).send()
    }
})

module.exports = router