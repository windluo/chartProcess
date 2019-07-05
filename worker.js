onmessage = function(e) {
  console.log('Worker: Message received from main script');
  postMessage(e.data.data);
}