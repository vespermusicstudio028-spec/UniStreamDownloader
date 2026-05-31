import { Response } from 'express';
import { logger } from '../utils/logger.js';

export type JobStatus = 'queued' | 'downloading' | 'converting' | 'validating' | 'finalizing' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  speed: string;
  eta: string;
  message: string;
  filePath?: string;
  filename?: string;
  error?: string;
  createdAt: number;
  clients: Set<Response>;
  // Audio/video metadata (populated after validation)
  duration?: number;      // seconds
  bitrate?: number;       // kbps
  sampleRate?: number;    // Hz
  channels?: number;
  fileSize?: number;      // bytes
  format?: string;
  validationErrors?: string[];
  convertedAt?: number;   // timestamp when done
}

const jobs = new Map<string, Job>();

export function createJob(id: string): Job {
  const job: Job = {
    id,
    status: 'queued',
    progress: 0,
    speed: '',
    eta: '',
    message: 'Na fila...',
    createdAt: Date.now(),
    clients: new Set(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<Omit<Job, 'id' | 'clients' | 'createdAt'>>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates);
  broadcastJob(job);
}

export function addClient(jobId: string, res: Response) {
  const job = jobs.get(jobId);
  if (!job) return false;
  job.clients.add(res);

  // Send current state immediately to new client
  sendEvent(res, job);

  res.on('close', () => {
    job.clients.delete(res);
  });
  return true;
}

function sendEvent(res: Response, job: Job) {
  const data = JSON.stringify({
    id: job.id,
    status: job.status,
    progress: job.progress,
    speed: job.speed,
    eta: job.eta,
    message: job.message,
    filePath: job.filePath,
    filename: job.filename,
    error: job.error,
    // Audio metadata
    duration: job.duration,
    bitrate: job.bitrate,
    sampleRate: job.sampleRate,
    channels: job.channels,
    fileSize: job.fileSize,
    format: job.format,
    convertedAt: job.convertedAt,
  });
  res.write(`data: ${data}\n\n`);
}

function broadcastJob(job: Job) {
  for (const client of job.clients) {
    try {
      sendEvent(client, job);
    } catch {
      job.clients.delete(client);
    }
  }
}

export function deleteJob(id: string) {
  jobs.delete(id);
}

// Clean up expired jobs (older than 2 hours)
export function cleanupExpiredJobs() {
  const now = Date.now();
  let removed = 0;
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 2 * 60 * 60 * 1000 && job.clients.size === 0) {
      jobs.delete(id);
      removed++;
    }
  }
  if (removed > 0) logger.debug('JobManager', `${removed} job(s) expirado(s) removido(s).`);
}

setInterval(cleanupExpiredJobs, 10 * 60 * 1000); // every 10 min

export function getActiveJobCount(): number {
  let count = 0;
  for (const job of jobs.values()) {
    if (job.status !== 'done' && job.status !== 'error') count++;
  }
  return count;
}
