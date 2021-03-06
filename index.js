/**
 * 一次性获取大量数据绘图，通过web workers解决绘图卡顿的问题
 */

const WIDTH = 800
const HEIGHT = 400

function simpleChart (opts) {
  // svg的容器
  this.$ele = opts.$ele
  this.width = opts.width || WIDTH
  this.height = opts.height || HEIGHT
  this.data = opts.data
  this.$svg = undefined

  // 执行初始化
  this.init()
}

simpleChart.prototype.init = function () {
  this.createChart()
}

simpleChart.prototype.createChart = function () {
  this.$svg = d3.select(this.$ele)
                .append('svg')
                .attr('width', this.width)
                .attr('height', this.height);
}

// 拆分渲染
simpleChart.prototype.renderChart = function (data) {
  let circle = this.$svg.selectAll("circle").data(data, function(d) { return d.number; })
  circle.enter()
    .append("circle")
    .attr("cx", function(d, i) { return d.x; })
    .attr("cy", function(d, i) { return d.y; })
    .attr("r", function(d) { return d.r; });

  // 既然是异步绘图，就不能有这个了
  // circle.exit().remove();

  console.log('绘图完成！')
}

/**
 * @description 根据数据计算坐标，怎么在有限的容器内放满所有的数据点。坐标随机计算
 */
function calculateCoordinates () {
  // 每个圆的半径都设定为12
  const radius = 2
  // 最大 x 坐标
  const MaxX = WIDTH - radius 
  // 最大 y 坐标
  const MaxY = HEIGHT - radius

  let postionX = Math.floor(Math.random() * MaxX)
  let postionY = Math.floor(Math.random() * MaxY)
  postionX = postionX < radius ? radius : postionX
  postionY = postionY < radius ? radius : postionY

  return {
    x: postionX,
    y: postionY,
    r: radius
  }
}

function createData () {
  let data = []
  let max = 100000

  for (var i = 1; i <= max; i++) {
    let post = calculateCoordinates()
    let obj = {
      number: createRandomNum(100),
      x: post.x,
      y: post.y,
      r: post.r
    }

    data.push(obj)
  }

  return data
}

function createRandomNum (max) {
  return Math.floor(Math.random() * max)
}

// 调用 web workers
function connectWorkers (data, sc) {
  const myWorker = new Worker("worker.js");

  myWorker.postMessage({
    data: data, // 源数据拿一次即可
    over: false, // 表示可以开始提供数据了
  });

  // workers
  myWorker.onmessage = function(e) {
    sc.renderChart(e.data.data)
    if (!e.data.over) {
      myWorker.postMessage({
        over: false, // 表示可以开始提供数据了
      });
    } else {
      console.log('workers 提供数据完毕')
    }
  };
}

let $svgWrap = document.getElementById('svgWrap')
setTimeout(() => {
  console.time('生成数据：')
  let data = createData()
  console.timeEnd('生成数据：')

  console.time('绘图：')
  let sc = new simpleChart({
    $ele: $svgWrap,
    data: data
  })

  connectWorkers(data, sc)
  // sc.renderChart(data)
  console.timeEnd('绘图：')
}, 1000);