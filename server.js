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
//669
var sliderRange = [0,669];
var step = 1;
let graphRanges = [[0,100],[101,300],[301,669]];//will need to actually compute

//precompute map of values
let db = new sqlite3.Database('./crashes.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('DB Connected');
  var startDate = new Date('January 2, 2018');
  var dateLimit = new Date('November 2, 2019');
  for (let i = sliderRange[0]; i <=sliderRange[1]; i++){
    dateLimit = startDate.addDays(i)
    dateStr = `${dateLimit.getFullYear()}-${twoDigit(dateLimit.getMonth()+1)}-${twoDigit(dateLimit.getDate())}`
    queryStr = 'SELECT borough, COUNT(*) as crashes FROM CRASHES WHERE borough!="" AND date<=? GROUP BY borough;'
    db.all(queryStr, [dateStr], (err, rows) => {
      queryMap.set(i, {data: rows, query: queryStr})
      console.log(i)
    })
  }
});

let scalesComputed = false;

function computeScales(){
  for (let range of graphRanges){
    for (let i = range[0]; i <= range[1]; i++){
      var max = 0;
      var data_obj = queryMap.get(i);
      for (let borough of data_obj.data){
        if (borough.crashes > max){
          max = borough.crashes
        }
      }
      let scale_domain = [0,max];
      for (let i = range[0]; i <= range[1]; i++){
        var data_obj = queryMap.get(i);
        data_obj.scale_domain = scale_domain
        queryMap.set(i,data_obj)
      }
    }

  }
  scalesComputed = true;
}




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
  socket.emit('init',sliderRange);
  socket.on('query', function(index){
    if(!scalesComputed){
      computeScales();
    }
    socket.emit('data', queryMap.get(parseInt(index)))
  });
});

http.listen(port, () => console.log(`Listening on port ${port}!`))
