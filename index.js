const express = require('express')
require('./db/mongoose')
const app = express()

// recognize incoming request as json object
app.use(express.json())

app.use(express.json())

// routes
app.use('/users', require('./routes/user'))
app.use('/posts', require('./routes/post'))

app.listen(3000, ()=> console.log('server is up'))