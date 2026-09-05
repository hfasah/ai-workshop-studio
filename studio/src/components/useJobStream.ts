import {useEffect, useRef, useState} from "react";
import type {Job, JobLine} from "../api";

// A line flagged `replace` overwrites the previous line (render progress), so a 3,600-frame render stays one line.
const mergeLines = (prev: JobLine[], add: JobLine[]) => {
  const out = prev.slice();
  for (const l of add) {
    if (l.replace && out.length && out[out.length - 1].progress) out[out.length - 1] = l;
    else out.push(l);
  }
  return out.length > 3000 ? out.slice(-3000) : out;
};

export type StreamState = {job: Job | null; lines: JobLine[]; done: boolean; exitCode: number | null; connected: boolean};

// Subscribes to GET /api/jobs/:id/stream (Server-Sent Events). Replays buffered lines, then live output, then {done}.
export const useJobStream = (jobId: string | null, onDone?: (exitCode: number) => void) => {
  const [state, setState] = useState<StreamState>({job: null, lines: [], done: false, exitCode: null, connected: false});
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!jobId) return;
    setState({job: null, lines: [], done: false, exitCode: null, connected: false});
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    let buffered: JobLine[] = [];
    let flush: number | null = null;
    const scheduleFlush = () => {
      if (flush !== null) return;
      flush = window.setTimeout(() => {
        flush = null;
        const add = buffered;
        buffered = [];
        setState((s) => ({...s, lines: mergeLines(s.lines, add)}));
      }, 80);
    };
    es.onopen = () => setState((s) => ({...s, connected: true}));
    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.job) setState((s) => ({...s, job: msg.job}));
      else if (msg.done) {
        if (flush !== null) {
          window.clearTimeout(flush);
          flush = null;
        }
        const add = buffered;
        buffered = [];
        setState((s) => ({...s, lines: mergeLines(s.lines, add), done: true, exitCode: msg.exitCode, job: s.job ? {...s.job, status: msg.status, exitCode: msg.exitCode} : s.job}));
        es.close();
        onDoneRef.current?.(msg.exitCode);
      } else if (msg.line !== undefined) {
        buffered.push(msg);
        scheduleFlush();
      }
    };
    es.onerror = () => setState((s) => (s.done ? s : {...s, connected: false}));
    return () => {
      es.close();
      if (flush !== null) window.clearTimeout(flush);
    };
  }, [jobId]);

  return state;
};
