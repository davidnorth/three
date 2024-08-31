
const URLS = {
  generateChunk: new URL('./generateChunk.js', import.meta.url),

}


class WorkerPool {

  constructor (workerName, workerCount, handleMessage) {
    this.workers = [];
    this.lastWorkerIndex = 0;
    let worker;

    const url = URLS[workerName];

    for(let i=0; i<workerCount; i++) {
      let fullFilename = './generateChunk.js';
      worker = new Worker(url, { type: 'module' });
      worker.onmessage = handleMessage;
      this.workers.push(worker);
    }
  }

  postMessage(payload) {
    const worker = this.workers[this.lastWorkerIndex];
    this.lastWorkerIndex = (this.lastWorkerIndex + 1) % this.workers.length;
    worker.postMessage(payload);
  }

}

export default WorkerPool;