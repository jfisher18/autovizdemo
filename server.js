const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const port = 3000;
var http = require('http').createServer(app);
var formidable = require('formidable');
var fs = require('fs');
var io = require('socket.io')(http);
var ejs = require('ejs');
app.set('view_engine', 'ejs');

var path = require('path');

app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname , 'views', '/index.html'));
})

app.get('/newdb', (req, res) => {
    res.sendFile(path.join(__dirname , 'views', '/newdb.html'));
})

app.post('/uploaddb', (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    fs.mkdir(path.join('dbs',fields.dbname), { recursive: true },  (err) => {
      if (err) throw err;
    });
    var fileloc = files.db.path;
    var newpath = path.join(__dirname, 'dbs', fields.dbname, (fields.dbname + ".db"));
    fs.rename(fileloc, newpath, (err) => {
    if (err) throw err;
      let db = new sqlite3.Database(newpath, (err) => {
        db.get(fields.query, [parseInt(fields.start)], (err, row) => {
          if (err) throw err;
          // Render ejs with keys from object
        })
      })
    });
    var textInfo = fields.query.trim();
    textInfo += "\n" + fields.start;
    textInfo += "\n" + fields.stop;
    textInfo += "\n" + fields.step;
    textInfo += "\n" + fields.breakpoints.trim();
    var textPath = path.join(__dirname, 'dbs', fields.dbname, (fields.dbname + ".txt"));
    fs.writeFile(textPath, textInfo, function (err) {
      if (err) throw err;
    });
  });
})

app.post('/submitfields', (req, res) => {
  //For each possible value, save results to .csv file (for fields we want)
  //Go through and calculate the scales, using breakpoints
  //Add to db list
});

// io.on('connection', function(socket){
//   socket.emit('init',sliderRange);
//   socket.on('query', function(index){
//     if(!scalesComputed){
//       computeScales();
//     }
//     socket.emit('data', queryMap.get(parseInt(index)))
//   });
// });

http.listen(port, () => console.log(`Listening on port ${port}!`))
