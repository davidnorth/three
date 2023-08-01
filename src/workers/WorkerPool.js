import perlin from 'perlin';
window.perlin=perlin;
class WorkerPool {

  constructor (workerFilename, workerCount, handleMessage) {
    this.workers = [];
    this.lastWorkerIndex = 0;
    let worker;
    for(let i=0; i<workerCount; i++) {
      let url = new URL('./generateChunk.js', import.meta.url);
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