### 绘图代码

#### 绘图

```js
simpleChart.prototype.createChart = function () {
  this.$svg = d3.select(this.$ele)
                .append('svg')
                .attr('width', this.width)
                .attr('height', this.height);
  
  let circle = this.$svg.selectAll("circle").data(this.data, function(d) { return d.number; })
  circle.enter()
    .append("circle")
    .attr("cx", function(d, i) { return d.x; })
    .attr("cy", function(d, i) { return d.y; })
    .attr("r", function(d) { return d.r; });

  circle.exit().remove();

  console.log('绘图完成！')
}
```

#### 生成坐标

```js
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
```

#### 生成数据

```js
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
```



### 不同数据绘制时间

分别生成一千条、一万条、十万条数据绘图。绘图的时间差距特别明显：

![001](D:\webproject\chartProcess\images\001.png)

从上图可以看到，十万条数据绘图的时间基本在2000ms左右徘徊，一万条和一千条数据的绘图时间都在500ms以下。

### 相同环境下绘图改进

这里只考虑在同样的网络环境下、同样的绘图算法下，一次性获取到大量的数据的情况下怎么通过web workers处理绘图卡顿的问题

> 所以这里不会考虑提升网络环境、优化绘图算法、异步分批加载数据这些优化措施

#### 拆分绘图脚本

```js
// 绘制 svg
simpleChart.prototype.createChart = function () {
  this.$svg = d3.select(this.$ele)
                .append('svg')
                .attr('width', this.width)
                .attr('height', this.height);
  
  this.renderChart()
}

// 拆分渲染，准备引入 web workers
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
```

#### 引入web workers