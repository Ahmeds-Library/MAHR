// 🎨 Pam's Architecture Diagram Solution: Async Event Queue & Main Thread Offloading
/**
 * [ MAIN THREAD (UI) ] 
 *       |
 *       | (1) "Task received!"
 *       v
 * [ ASYNC QUEUE (Buffer) ] <--- Tasks wait here safely
 *       |
 *       | (2) "Pick next available task"
 *       v
 * [ WORKER/PROCESSOR ] <--- Heavy lifting happens here (Offloaded)
 *       |
 *       | (3) "Task done, notify UI"
 *       v
 * [ CALLBACK / PROMISE RESOLUTION ]
 */

export interface AsyncQueueTask<T = any> {
  id: string;
  payload: T;
  priority: 'high' | 'normal' | 'low';
  execute: () => Promise<void>;
}

export class MainThreadOffloader {
  private queue: AsyncQueueTask[] = [];
  private isProcessing = false;

  public enqueue(task: AsyncQueueTask): void {
    this.queue.push(task);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task.execute();
      } catch (err) {
        console.error(`[Worker] Error executing task ${task.id}:`, err);
      }
    }
    this.isProcessing = false;
    this.processNext();
  }
}