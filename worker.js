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