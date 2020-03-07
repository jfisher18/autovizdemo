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
var bodyParser = require('body-parser')
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

var s_loadeddb = ""
var s_dataMap, s_xField, s_yField, s_start, s_stop, s_step, s_encoding;

var path = require('path');


app.use(express.static('public'))

app.get('/viz', (req, res) => {
  res.sendFile(path.join(__dirname , 'views', '/viz.html'));
})

app.get('/', (req, res) => {
  fs.readdir(path.join(__dirname, 'dbs'), (err, folders) => {
    if (err) throw err;
    res.render('index.ejs', {dbs: folders});
  });
})

app.get('/newdb', (req, res) => {
  res.sendFile(path.join(__dirname , 'views', '/newdb.html'));
})


let pilotdata = new sqlite3.Database(path.join(__dirname, "pilotdata.db"), (err) => {
  if (err) throw err;
})

app.post('/submitdata', (req, res) => {
  var results = req.body.results
  pilotdata.run(`INSERT INTO results (method, task_order,
    t1year, t1month, t1price,
    t1time, t1mental, t1effort, t1performance, t1frustruation,
    t2month, t2price,
    t2time, t2mental, t2effort, t2performance, t2frustruation,
    t3year, t3difference,
    t3time, t3mental, t3effort, t3performance, t3frustruation)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.body.method, req.body.order,
      results[0].answer[0], results[0].answer[1], results[0].answer[2],
      results[0].time,
      results[0].effort, results[0].mental, results[0].performance, results[0].frustration,
      results[1].answer[0], results[1].answer[1],
      results[1].time,
      results[1].effort, results[1].mental, results[1].performance, results[1].frustration,
      results[2].answer[0], results[2].answer[1],
      results[2].time,
      results[2].effort, results[2].mental, results[2].performance, results[2].frustration
    ],
    (err) => {if (err) throw err}
  );
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
        db.run(`CREATE TABLE ${fields.dbname}_info(query TEXT, start REAL, stop REAL, step REAL, stepnum INT, encoding TEXT)`, [], (err) => {
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
        db.run(`UPDATE ${fields.dbname}_info SET encoding = ?`,
        [fields.encoding], (err) => {if (err) throw err})
        db.run(`CREATE TABLE ${fields.dbname}_data(sliderindex REAL, query TEXT,
          x_${x_name} ${x_type}, y_${y_name} ${y_type}, scale_min REAL, scale_max REAL,
          scale_min_g REAL, scale_max_g REAL)`, (err) => {
          if (err) throw err;
          for (let i = row.start; i <= row.stop; i+=row.step) {
            console.log(i)
            db.all(row.query, [i], (err, rows) => {
              console.log(i)
              for (datarow of rows){
                var x_field = datarow[x_name];
                var y_field = datarow[y_name];
                var this_query = row.query.replace("?", i);
                db.run(`INSERT INTO ${fields.dbname}_data(sliderindex, query, x_${x_name},
                y_${y_name}) VALUES(?, ?, ?, ?)`, [i, this_query, x_field, y_field,],
                (err) => {if (err) throw err});
              }
            })
            // db.all(`INSERT INTO ${fields.dbname}_data(sliderindex, query, x_${x_name}, y_${y_name})
            // VALUES(?, ?, (SELECT ${x_name} FROM (${row.query})),
            // (SELECT ${y_name} FROM (${row.query})))`,
            // [i, row.query.replace("?", i), i, i], (err) => {
            //   if (err) throw err;
            // })
          }
        })
      })
    })
    db.close();
    res.redirect('/')
  });
});

io.on('connection', function(socket){
  socket.on('switchdb', function(dbname){
    if (dbname == s_loadeddb) {
      socket.emit('loadeddb', s_yField, s_xField, s_start, s_stop, s_step, s_encoding, dbname)
    } else {
      var dbpath = path.join(__dirname, 'dbs', dbname, (dbname+'.db'))
      let db = new sqlite3.Database(dbpath, (err) => {
        if (err) throw err;
      })
      db.get(`SELECT * FROM ${dbname}_info`, (err, row) => {
        if (err) throw err;
        db.all(`SELECT * FROM ${dbname}_data WHERE scale_max IS NOT NULL AND scale_max_g IS NOT NULL`, (err, rows) => {
          if (row.stepnum == rows.length) {
            s_dataMap =  new Map();
            for (datarow of rows) {
              s_dataMap.set(datarow.sliderindex, datarow)
            }
            db.get(`SELECT * FROM ${dbname}_info`, (err, info) => {
              if (err) throw err;
              s_yField = Object.keys(rows[0]).filter(key => key.startsWith("y_"))[0].substring(2)
              s_xField = Object.keys(rows[0]).filter(key => key.startsWith("x_"))[0].substring(2)
              s_start = info.start
              s_stop = info.stop
              s_step = info.step
              s_encoding = info.encoding
              s_loadeddb = dbname
              socket.emit('loadeddb', s_yField, s_xField, s_start, s_stop, s_step, s_encoding, dbname)
            })
            console.log("DATA READY!!!")

          } else {
            if (rows.length != 0) {
              socket.emit('calcscales', rows.length/row.stepnum)
            } else {
              db.all(`SELECT * FROM ${dbname}_data`, (err, rows2) => {
                if (err) throw err;
                if (row.stepnum == rows2.length) {
                  calcScales(db, dbname);
                  socket.emit('calcscales', 0);
                } else {
                  socket.emit('calcdata', rows2.length/row.row.stepnum);
                }
              })
            }
          }
        })
      })
      db.close()
    }
  })
  socket.on('query', function(index){
    socket.emit('data', s_dataMap.get(parseFloat(index)))
  });
})

function calcScales(db, dbname) {
  db.all(`SELECT * FROM ${dbname}_breakpoints`, (err, rows) => {
    if (err) throw err;
    var bps = rows.map(el => el.bp)
    bps.sort((a,b) => b-a)
    db.all(`SELECT * FROM ${dbname}_data ORDER BY sliderindex`, (err, rows) => {
      var yfield = Object.keys(rows[0]).filter(key => key.startsWith("y_"))[0]
      if (err) throw err;
      var currbp = bps[0];
      var currbpidx = 0;
      var prevbp = null;
      var currmax = rows[0][yfield];
      var currmin = currmax;
      var globalmax = currmax;
      var globalmin = globalmax;
      for (row of rows) {
        if (currbp && row.sliderindex > currbp){
          if (prevbp) {
            db.run(`UPDATE ${dbname}_data SET scale_max = ?, scale_min = ?
            WHERE sliderindex > ? AND sliderindex <= ?`, [currmax, currmin, prevbp, currbp],
            (err) => {if (err) throw err});
          } else {
            db.run(`UPDATE ${dbname}_data SET scale_max = ?, scale_min = ?
            WHERE sliderindex <= ?`, [currmax, currmin, currbp],
            (err) => {if (err) throw err});
          }
          prevbp = currbp
          currbpidx++
          if(currbpidx > bps.length-1){
            currbp = null
          } else {
            currbp = bps[currbpidx]
          }
          currmax = row[yfield];
          currmin = row[yfield];
        }
        currmax = Math.max(currmax, row[yfield])
        globalmax = Math.max(globalmax, row[yfield])
        currmin = Math.min(currmin, row[yfield])
        globalmin = Math.min(globalmin, row[yfield])
      }
      db.run(`UPDATE ${dbname}_data SET scale_max = ?, scale_min = ?
      WHERE sliderindex > ?`, [currmax, currmin, prevbp],
      (err) => {if (err) throw err});
      db.run(`UPDATE ${dbname}_data SET scale_max_g = ?, scale_min_g = ?`,
      [globalmax, globalmax],
      (err) => {if (err) throw err});
    })
  })
}

http.listen(port, () => console.log(`Listening on port ${port}!`))
