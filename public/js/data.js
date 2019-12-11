function twoDigit(num){
  if (num>=10){
    return num.toString();
  } else {
    return "0"+num.toString();
  }
}
let max = 0;
let slider = document.querySelector('input');
let query = document.getElementById('query');
var socket = io();
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
var startDate = new Date('January 2, 2018');
var dateLimit = new Date('November 2, 2019');
slider.addEventListener('input', updateData);

let spec1 = {
  "width": 200,
  "height": 300,
  "mark": "bar",
  "encoding": {
    "x": {"field": "borough", "type": "nominal"},
    "y": {"field": "crashes", "type": "quantitative", "scale": {"type": "linear", "nice": false}}
  }
}
let spec2 = JSON.parse(JSON.stringify(spec1));
spec2.encoding.y.scale.domain=[0,0];
let spec3 = JSON.parse(JSON.stringify(spec1));
spec3.encoding.y.scale.type="log";
let spec4 = JSON.parse(JSON.stringify(spec3));
spec4.encoding.y.scale.domain=[18,0];
spec1.title = "Naive Linear"
spec2.title = "Linear w Max"
spec3.title = "Naive Log"
spec4.title = "Log w Max"


function updateData() {
  dateLimit = startDate.addDays(parseInt(slider.value))
  // console.log(dateLimit)
  queryStr = `SELECT borough, COUNT(*) as crashes FROM CRASHES WHERE borough!="" AND date<="${dateLimit.getFullYear()}-${twoDigit(dateLimit.getMonth()+1)}-${twoDigit(dateLimit.getDate())}" GROUP BY borough;`
  socket.emit('query', slider.value);
  query.innerText=queryStr;
}

socket.on('data',function(data) {
  for (var i = 0; i < data.length; i++){
    var id = "b"+i;
    var box = document.getElementById(id)
    box.innerText=data[i].crashes;
  }
  spec = {
    "data": {
      "values": data
    },
    "hconcat": [spec1,spec2,spec3,spec4]
  }
  vegaEmbed('#vis1', spec);
});

socket.on('max',function(data) {
    max=data
    spec2.encoding.y.scale.domain[1]=max
    spec4.encoding.y.scale.domain[1]=max
});
