const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const port = 3000;
var http = require('http').createServer(app);
var formidable = require('formidable');
var fs = require('fs');
var os = require('os');
var io = require('socket.io')(http);
var ejs = require('ejs');
app.set('view_engine', 'ejs');

var db = ""
var dataMap = null;

var path = require('path');

app.use(express.static('public'))


app.get('/', (req, res) => {
  fs.readdir(path.join(__dirname, 'dbs'), (err, folders) => {
    if (err) throw err;
    res.render('index.ejs', {dbs: folders});
  });
})

app.get('/newdb', (req, res) => {
  res.sendFile(path.join(__dirname , 'views', '/newdb.html'));
})

app.post('/uploaddb', (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    fs.mkdir(path.join('dbs',fields.dbname), { recursive: true },  (err) => {
      if (err) throw err;
      var newpath = path.join(__dirname, 'dbs', fields.dbname, (fields.dbname + ".db"));
      fs.rename(files.db.path, newpath, (err) => {
        if (err) throw err;
        let db = new sqlite3.Database(newpath, (err) => {
          if (err) throw err;
        })
        db.get(fields.query, [parseInt(fields.start)], (err, row) => {
          if (err) throw err;
          var schema = [];
          for (var key of Object.keys(row)) {
            var type = typeof row[key];
            if (type == 'number'){
              schema.push({name: key, type: 'REAL'})
            } else if (type == 'string'){
              schema.push({name: key, type: 'TEXT'})
            }
          }
          res.render('submitfields.ejs', {schema: schema, name: fields.dbname})
        })
        db.run(`CREATE TABLE ${fields.dbname}_info(query TEXT, start REAL, stop REAL, step REAL, stepnum INT)`, [], (err) => {
          if (err) throw err;
          var start = parseFloat(fields.start)
          var stop = parseFloat(fields.stop)
          var step = parseFloat(fields.step)
          var stepnum = Math.floor((stop - start)/step)+1;
          db.run(`INSERT INTO ${fields.dbname}_info(query, start, stop, step, stepnum)
            VALUES(?, ?, ?, ?, ?)`,
            [fields.query.trim(), start, stop, step, stepnum], (err) => {
              if (err) throw err;
          })
        })
        db.run(`CREATE TABLE ${fields.dbname}_breakpoints(bp REAL)`, [], (err) => {
          if (err) throw err;
          var bps = fields.breakpoints.trim().split(',')
          bps.forEach((bp) => {
            db.run(`INSERT INTO ${fields.dbname}_breakpoints(bp) VALUES(?)`, [parseFloat(bp)], (err) => {
              if (err) throw err
            });
          });
        });
        db.close();
      });
    });
  });
})

app.post('/submitfields', (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    //name, xaxis, yaxis, encoding
    var dbPath = path.join(__dirname, 'dbs', fields.dbname, (fields.dbname+".db"))
    let db = new sqlite3.Database(dbPath, (err) => {
      //MAKE VAL FOR ENCODING in info!!
      db.get(`SELECT * FROM ${fields.dbname}_info`, (err, row) => {
        if (err) throw err;
        var xaxis = fields.xaxis.split("|")
        var x_name = xaxis[0]
        var x_type = xaxis[1]
        var yaxis = fields.yaxis.split("|")
        var y_name = yaxis[0]
        var y_type = yaxis[1]
        db.run(`CREATE TABLE ${fields.dbname}_data(step INT PRIMARY KEY, query TEXT,
          x_${x_name} ${x_type}, y_${y_name} ${y_type}, scale_min REAL, scale_max REAL,
          scale_min_g REAL, scale_max_g REAL)`, (err) => {
          if (err) throw err;
          for (var i = row.start; i <= row.stop; i+=row.step) {
            //Lmao what is the actual way to get the output query??
            //I am doing 2 select clauses - that is so bad
            db.run(`INSERT INTO ${fields.dbname}_data(step, query, x_${x_name}, y_${y_name})
            VALUES(?, ?, (SELECT ${x_name} FROM (${row.query})),
            (SELECT ${y_name} FROM (${row.query})))`,
            [i, row.query.replace("?", i), i], (err) => {
              if (err) throw err;
            })
          }
        })
      })
    })
    db.close();
    res.redirect('/')
  });
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
