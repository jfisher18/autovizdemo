const sqlite3 = require('sqlite3').verbose();

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function twoDigit(num){
  if (num>=10){
    return num.toString();
  } else {
    return "0"+num.toString();
  }
}

var queryMap = new Map();
let db = new sqlite3.Database('./crashes.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('DB Connected');
  var startDate = new Date('January 2, 2018');
  var dateLimit = new Date('November 2, 2019');
  for (let i = 0; i <=669; i++){
    dateLimit = startDate.addDays(i)
    queryStr = `SELECT borough, COUNT(*) as crashes FROM CRASHES WHERE borough!="" AND date<="${dateLimit.getFullYear()}-${twoDigit(dateLimit.getMonth()+1)}-${twoDigit(dateLimit.getDate())}" GROUP BY borough;`
    db.all(queryStr, [], (err, rows) => {
      queryMap.set(i, rows)
      console.log(i)
    })
  }
});

const express = require('express');
const app = express();
const port = 3000
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var path = require('path');

app.use(express.static('public'))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
})


io.on('connection', function(socket){
  db.get('SELECT MAX(count) as max FROM (SELECT borough, COUNT(*) as count FROM CRASHES WHERE borough!="" GROUP BY borough)', [], (err, row) => {
    if (err) {
      throw err;l
    }
    socket.emit('max',row.max);
  });
  socket.on('query', function(index){
    socket.emit('data', queryMap.get(parseInt(index)))
    // db.all(query, [], (err, rows) => {
    //   if (err) {
    //     throw err;
    //   }
    //   socket.emit('data',rows);
    // });
  });
});


http.listen(port, () => console.log(`Listening on port ${port}!`))
