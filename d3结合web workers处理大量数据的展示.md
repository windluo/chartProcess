D3是一个JavaScript库， 将强大的可视化和交互技术与数据驱动的DOM操作方法相结合，为我们提供现代浏览器的全部功能，并可以灵活的将数据设计出 正确的可视界面。

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

![001](<https://github.com/windluo/chartProcess/blob/master/images/001.png>)

从上图可以看到，十万条数据绘图的时间基本在2000ms左右徘徊，一万条和一千条数据的绘图时间都在500ms以下。也就是说，在数据量很大的情况下，用户不仅要等待数据请求过程中的延迟，还要等待绘图的延迟，页面会出现长期的空白期，这是很让人难受的。

### 相同环境下绘图改进

这里只考虑在同样的网络环境下、同样的绘图算法下，一次性获取到大量的数据的情况下怎么通过web workers处理绘图高延迟的问题

> 所以这里不会考虑提升网络环境、优化绘图算法、异步分批加载数据这些优化措施。
>
> 另外，在没有动画、拖拽这些动作的情况下，一次性绘制大量数据只有延迟，不会出现卡顿。

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



### 引入web workers解决绘图延迟

web workers的特点是**多进程**，独立运行于主线程外的后台线程，从而允许主线程不被阻塞或放慢。

放在这里的解决思路就是，在一次性获取到十万条数据，将数据推到web workers，一批一批的将数据绘制到页面。

> 比如将十万条数据化为十个一万条数据

**流程如下：**

> 1、主线程拿到数据通知workers
>
> 2、workers拆分数据，告知主线程绘制第一批数据
>
> 3、第一批绘制完成后，主线程告知workers提供第二批数据
>
> 4、依次进行，直到最后一批数据绘制完成

#### worker.js

由于 Worker 不能读取本地文件，所以这个脚本必须来自网络，本地跑的话要搭一个服务，比如用`nginx`。

```js
onmessage = function(e) {
  console.log('Worker: Message received from main script');
  postMessage(e.data.data);
}
```

#### 调用 workers 绘图

```js
// 调用 web workers
function connectWorkers (data, sc) {
  const myWorker = new Worker("worker.js");

  myWorker.postMessage({
    data: data, // 源数据拿一次即可
    over: false, // 表示可以开始提供数据了
  });

  // workers
  myWorker.onmessage = function(e) {
    // 把渲染图形放到 workers 响应里
    sc.renderChart(e.data)
  };
}
```

#### 生成数据

```js
let data = createData()
let sc = new simpleChart({
     $ele: $svgWrap,
     data: data
})

// 生成数据和svg后，调用workers绘图
connectWorkers(data, sc)
```



### 优化 worker.js

优化 `worker.js` 处理大量数据

#### 改进版 worker.js

```js
/**
 * @description 通过 web workers 分批绘制数据
 */
let worker = {
  pageSize: 10000,
  data: [],

  spliceDataHandle: function() {
    let spliceData = worker.data.splice(0, worker.pageSize)

    return spliceData
  },

  checkOver: function() {
    return worker.data.length === 0 ? true : false
  }
}

onmessage = function(e) {
  console.log('Worker: Message received from main script');

  if (e.data.data) {
    worker.data = e.data.data
  }

  postMessage({
    data: worker.spliceDataHandle(),
    over: worker.checkOver()
  });
}
```

#### 调用 workers

```js
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
```

一次性插入十万条数据绘制而不采用 `web workers` ，除去获取数据的时间，还有很明显的绘图延迟。采用 `web workers` 后，在获取到完整的数据分批绘制，可以明显的看到有一屏瞬开绘制，然后依次绘制后续的数据。

web workers 的兼容性还不错：

![001](<https://github.com/windluo/chartProcess/blob/master/images/002.png>)

### web worker 与 Service worker 对比

web worker 独立于主线程，不能操作 DOM，不同页面间不能共享，页面关闭后即消失，兼容性相对较好。

service worker 也独立于主线程，不能操作 DOM，需要下载安装，可以离线。按同源策略可以服务于多个页面，页面关闭依然会存在。兼容性较差。