type QueueTask = {
  runId: string;
  label: string;
  execute: () => Promise<void>;
};

export interface QueueSnapshot {
  concurrency: number;
  active: number;
  pending: Array<{ runId: string; label: string }>;
}

export class PipelineJobQueue {
  private readonly concurrency: number;
  private readonly pending: QueueTask[] = [];
  private active = 0;

  constructor(concurrency = 1) {
    this.concurrency = Math.max(1, concurrency);
  }

  enqueue(task: QueueTask): void {
    this.pending.push(task);
    this.pump();
  }

  snapshot(): QueueSnapshot {
    return {
      concurrency: this.concurrency,
      active: this.active,
      pending: this.pending.map((p) => ({ runId: p.runId, label: p.label })),
    };
  }

  private pump(): void {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) break;
      this.active += 1;
      void this.runTask(next);
    }
  }

  private async runTask(task: QueueTask): Promise<void> {
    try {
      await task.execute();
    } finally {
      this.active = Math.max(0, this.active - 1);
      this.pump();
    }
  }
}

const configuredConcurrency = Number(process.env.PIPELINE_QUEUE_CONCURRENCY || "1");

export const pipelineJobQueue = new PipelineJobQueue(
  Number.isFinite(configuredConcurrency) ? configuredConcurrency : 1,
);
