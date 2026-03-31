import { Response } from 'express';
export class StreamHandler {
  static setupSSE(res: Response): void { res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache'); res.setHeader('Connection', 'keep-alive'); res.setHeader('X-Accel-Buffering', 'no'); res.flushHeaders(); }
  static write(res: Response, data: Record<string, unknown>): void { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* closed */ } }
  static writeChunk(res: Response, chunk: string): void { StreamHandler.write(res, { chunk }); }
  static writeDone(res: Response): void { StreamHandler.write(res, { done: true }); res.end(); }
  static writeError(res: Response, message: string): void { StreamHandler.write(res, { error: message }); }
}
