var socket = io();
var encoding;
var xf;
var yf;
var encoding;

let spec_temp = {
  "width": 200,
  "height": 300,
  "mark": "",
  "encoding": {
    "x": {"field": "", "type": "nominal"},
    "y": {"field": "", "type": "quantitative", "scale": {"type": "linear", "nice": false}}
  }
}

let slider = document.querySelector('input');

slider.addEventListener('input', updateData);

function switchdb(dbname) {
  socket.emit('switchdb', dbname);
}

socket.on('calcdata', (percent) => {
  alert(`Calculating data, ${percent*100}% done`)
});

socket.on('calcscales', (percent) => {
  alert(`Calculating scales, ${percent*100}% done`)
});

socket.on('loadeddb', (xf_, yf_, start, stop, step, encoding_, dbname) => {
    slider.min = start
    slider.max = stop
    slider.step = step
    xf = xf_
    yf = yf_
    encoding = encoding_
});

socket.on('data', (data) => {
  console.log(data)
});

function updateData() {
  socket.emit('query', slider.value);
}
