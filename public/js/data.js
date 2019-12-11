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
spec1.title = "Naive Linear"
spec2.title = "Linear w Max"


function updateData() {
  socket.emit('query', slider.value);
}

socket.on('init',function(range) {
    slider.min = range[0]
    slider.max = range[1]
    // spec2.encoding.y.scale.domain[1]=max
    // spec4.encoding.y.scale.domain[1]=max
});

socket.on('data',function(resp) {
  for (var i = 0; i < resp.data.length; i++){
    var id = "b"+i;
    var box = document.getElementById(id)
    box.innerText=resp.data[i].crashes;
    query.innerText = resp.query
  }

  spec2.encoding.y.scale.domain=resp.scale_domain;
  spec = {
    "data": {
      "values": resp.data
    },
    "hconcat": [spec1,spec2]
  }
  vegaEmbed('#vis', spec);
});
