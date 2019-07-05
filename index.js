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
  
  this.renderChart()
}

// 拆分渲染
simpleChart.prototype.renderChart = function () {
  let circle = this.$svg.selectAll("circle").data(this.data, function(d) { return d.number; })
  circle.enter()
    .append("circle")
    .attr("cx", function(d, i) { return d.x; })
    .attr("cy", function(d, i) { return d.y; })
    .attr("r", function(d) { return d.r; });

  circle.exit().remove();

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

let $svgWrap = document.getElementById('svgWrap')
setTimeout(() => {
  console.time('生成数据：')
  let data = createData()
  console.timeEnd('生成数据：')

  let strData = JSON.stringify(data)
  console.log('数据长度：' + strData.length)

  console.time('绘图：')
  let sc = new simpleChart({
    $ele: $svgWrap,
    data: data
  })
  console.timeEnd('绘图：')
}, 1000);