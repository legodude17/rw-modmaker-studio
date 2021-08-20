import { Seq } from 'immutable';
import { cpus } from 'os';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { Task, TaskResult } from './workerTypes';
import log from './log';

const workers: Worker[] = [];
const workQueue: Task[] = [];
const busy: Map<Worker, boolean> = new Map();
const listeners: {
  ids: number[];
  onFinished: (res: TaskResult[]) => void;
  results: TaskResult[];
  onError: (err?: string) => void;
}[] = [];

function distributeTasks() {
  log.debug('Distributing tasks!');
  Seq(busy.entries())
    .filter(([, b]) => !b)
    .forEach(([worker]) => {
      const task = workQueue.shift();
      if (task) {
        log.debug('Giving worker', worker.threadId, 'task', task.id);
        worker.postMessage(task);
        busy.set(worker, true);
      }
      return workQueue.length;
    });
}

function addWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, 'dist', 'worker.js'));
    worker.on('message', (result: TaskResult) => {
      log.debug('Got message from worker', worker.threadId);
      busy.set(worker, false);
      const remove: number[] = [];
      listeners
        .filter((l) => l.ids.includes(result.id))
        .forEach((l, i) => {
          if (result.error) {
            l.onError(result.error.toString());
          } else {
            l.results.push(result);
            if (l.results.length >= l.ids.length) {
              l.onFinished(l.results);
              remove.push(i);
            }
          }
        });
      distributeTasks();
      remove.forEach((i) => listeners.splice(i, 1));
    });
    worker.on('online', (...args) => {
      console.log('Worker online!', ...args);
      resolve(args);
    });
    worker.on('error', reject);
    busy.set(worker, false);
    workers.push(worker);
  });
}

export function doTasks(tasks: Task[]): Promise<TaskResult[]> {
  return new Promise((resolve, reject) => {
    const ids: number[] = [];
    tasks.forEach((task) =>
      ids.push((task.id = Math.random() * 10 ** Math.round(Math.random() * 10)))
    );
    listeners.push({
      ids,
      results: [],
      onFinished: resolve,
      onError: reject,
    });
    tasks.forEach((task) => workQueue.push(task));
    distributeTasks();
  });
}

export function init(numberOfWorkers: number = cpus().length) {
  return Promise.all(
    Array(numberOfWorkers)
      .fill(0)
      .map(() => addWorker())
  );
}

export function end() {
  return Promise.all(workers.map((worker) => worker.terminate()));
}
