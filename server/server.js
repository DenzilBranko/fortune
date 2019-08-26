const server = require('express')
const app = require('./app')
port = 5000

app.listen(port, () => console.log(`Example app listening on port ${port}!`))


module.exports = server