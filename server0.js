const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
var port = process.env.PORT || 3000;
var http = require('http').createServer(app);
var formidable = require('formidable');
var fs = require('fs');
var os = require('os');
var io = require('socket.io')(http);
var ejs = require('ejs');
app.set('view_engine', 'ejs');

var path = require('path');


app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname , 'views', '/viz.html'));
})

app.post('/submitdata', (req, res) => {

})
http.listen(port, () => console.log(`Listening on port ${port}!`))
