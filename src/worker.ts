import { isMainThread, parentPort } from 'worker_threads';
import { Task } from './workerTypes';
import { createManager, usesFromDefs } from './DataManager';

if (isMainThread) throw new Error('Only use worker.ts as a worker');

parentPort?.on('message', async (message: Task) => {
  console.log('Got message!');
  if (message.type === 'uses') {
    const uses = {};
    const Data = createManager(message.data);
    const failedTypes: Set<string> = new Set();
    usesFromDefs(message.text, uses, Data, failedTypes);
    parentPort?.postMessage({ uses, failedTypes, id: message.id });
  }
});

console.log('Worker online!');
