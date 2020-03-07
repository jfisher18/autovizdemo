let max = 0;
let slider = document.querySelector('#slider');
let query = document.getElementById('query');
let tool = document.getElementById('tool');
let intro = document.getElementById('intro');
let doneDummyIntro = document.getElementById('doneDummyIntro');
let haveAnswer = document.getElementById('haveAnswer');
let submission = document.getElementById('submission');
let begintask0 = document.getElementById('begintask0');
let begintask = document.getElementById('begintask');
let taskQuestion = document.getElementById('taskQuestion');
let mentalSlider = document.querySelector('#mental');
let effortSlider = document.querySelector('#effort');
let performanceSlider = document.querySelector('#performance');
let frustrationSlider = document.querySelector('#frustration');
let rating = document.getElementById('rating');
let done = document.getElementById('done');
let tutorial = document.getElementById('tutorial');
let optionalScale = document.getElementById('optionalScale');
let textArea = document.getElementById('textArea');
let inputs = ["year", "month", "value"];


slider.addEventListener('input', updateData);
// rater.addEventListener('input', () => {
//   rating.innerText = rater.value
// });

let spec_base = {
  "width": "container",
  "height": 400,
  "mark": "",
  "transform": [
    {"calculate": "monthFormat(datum.month-1)", "as": "monthStr"},
  ],
  "encoding": {
    "x": {
      "field": "monthStr",
      "type": "ordinal",
      "sort": {"op": "min", "field": "month"},
      "axis": {"title": "Month"}
    },
    "y": {
      "axis": {"title": "Oil Price (USD)"},
      "field": "",
      "type": "quantitative",
      "scale": {
        "type": "linear",
        "nice": false,
        "zero": false
      }
    }
  }
}
var dataMap = new Map();
var xname = "";
var yname = "";
var encoding = "";
var gmax = 0;
var gmin = 0;
var method = "";
var label = "";
var tasks = [];
var task_order = [];
var cur_task = -1;
var tasks_results = [];
var start_time;
var time_took;

async function load_data(fname) {
  await $.getJSON(fname, function(config) {
    xname = config['xname'];
    yname = config['yname'];
    encoding = config['encoding']
    if (encoding == 'scatter'){
      encoding = "point"
    }
    spec_base['mark'] = encoding
    gmax = config['gmax']
    gmin = config['gmin']
    method = config['method']
    const urlParams = new URLSearchParams(window.location.search);
    const methodParam = urlParams.get('method');
    if(methodParam){
      method = methodParam;
    }
    label = config['label']
    for (index of config['data']){
      dataMap.set(parseFloat(index['index']),index)
    }
    tasks = config['tasks']
    task_order = []
    range = []
    for (var i = 0; i < tasks.length; i++) {
      range.push(i)
    }
    for (var i = 0; i < tasks.length; i++) {
      index = Math.floor(Math.random() * (range.length));
      task_order.push(range[index])
      range.splice(index, 1)
    }
    cur_task = -1;
    tasks_results = [];
    slider.min = config['start'];
    slider.max = config['stop'];
    slider.step = config['step'];
    var steps = Math.floor((config['stop']-config['start'])/config['step']/2)
    slider.value = config['start']+steps*config['step'];
    vegaEmbed('#vis', {});
    query.innerText = ""
  });
}

load_data("badconfig.json")

function updateData() {
  var data = dataMap.get(parseFloat(slider.value))
  query.innerText = `${label}: ${slider.value}`
  // spec_base.encoding.x.field = xname;
  // if ((typeof data.records[xname]) == 'number'){
  //   spec_base.encoding.x.type = 'quantitative'
  // } else {
  //   spec_base.encoding.x.type = 'nominal'
  // }
  spec_base.encoding.y.field = yname;

  spec_global = JSON.parse(JSON.stringify(spec_base))
  spec_bp = JSON.parse(JSON.stringify(spec_base))
  spec_global.encoding.y.scale.domain = []
  spec_bp.encoding.y.scale.domain = []
  spec_global.encoding.y.scale.domain[0] = gmin
  spec_global.encoding.y.scale.domain[1] = gmax
  spec_bp.encoding.y.scale.domain[0] = data.min
  spec_bp.encoding.y.scale.domain[1] = data.max
  // spec_base.title = "per-chart"
  // spec_global.title = "global"
  // spec_bp.title = "breakpoints"
  var spec;
  if(method == "global"){
    spec = spec_global
  }
  if(method == "per-chart"){
    spec = spec_base
  }
  if(method == "breakpoints"){
    spec = spec_bp
  }
  var spec = {
    "data": {
      "values": data.records
    },
    "config": {
      "axis": {
        "labelFontSize": 16,
        "titleFontSize": 20
      }
    },
    "hconcat": [spec]
  }
  vegaEmbed('#vis', spec);
}

function dummyData() {
  intro.style.display = "none"
  tool.style.display = "block"
  updateData();
  doneDummyIntro.style.display = "block"
  tutorial.style.display = "block"
  if(method == "global"){
    optionalScale.style.display = "none"
  }
  haveAnswer.style.display = "none"
  taskQuestion.innerText = "Tutorial"
}

function doneDummy() {
  doneDummyIntro.style.display = "none"
  tutorial.style.display = "none"
  haveAnswer.style.display = "block"
  tool.style.display = "none"
  begintask0.style.display = "block"
  return false
}

function answers() {
  var d = new Date();
  time_took = d.getTime()-start_time
  tool.style.display = "none"
  for (let inputName of inputs) {
    document.getElementById(inputName).style.display = "none"
  }
  for (let input of tasks[task_order[cur_task]].answers) {
    document.getElementById(input.type).style.display = "block"
    document.getElementById(`${input.type}Label`).innerText = input.label+":"
  }
  submitAnswer.style.display = "block"

  return false
}

async function taskStart() {
  if(cur_task >= 0){
    var vals = {}
    var answers = []
    for (let inputName of tasks[task_order[cur_task]].answers) {
      var input = document.getElementById(inputName.type+"Ans")
      answers.push(input.value)
      input.value = ""
    }
    console.log(answers)
    vals.answer = answers
    vals.mental = mentalSlider.value
    mentalSlider.value = 4
    vals.effort = effortSlider.value
    effortSlider.value = 4
    vals.performance = performanceSlider.value
    performanceSlider.value = 4
    vals.frustration = frustrationSlider.value
    frustrationSlider.value = 4
    vals.textArea = textArea.value
    textArea.value = ""
    vals.time = time_took
    tasks_results[task_order[cur_task]] = vals
  } else {
    await load_data("config.json")
  }
  cur_task++
  if(cur_task>=tasks.length) {
    begintask0.style.display = "none"
    begintask.style.display = "none"
    done.style.display = "block"
    fetch("/submitdata", {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({results: tasks_results, method: method, order: task_order.join(' ')})
    });
  } else {
    taskQuestion.innerHTML = `Task ${cur_task+1}:<br>${tasks[task_order[cur_task]].question}`
    tool.style.display = "block"
    updateData();
    begintask0.style.display = "none"
    begintask.style.display = "none"
    var d = new Date();
    start_time = d.getTime()
  }
  return false
}

function submit() {
  submitAnswer.style.display = "none"
  begintask.style.display = "block"
  return false
}
//MEMORY LEAK VEGA ERROR?
