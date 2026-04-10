import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Global rescan progress.
 *
 * Holds a map of active rescan jobs so the user can navigate away from the
 * Nommo tab while a Visual DNA (or Subtaste / WritingDNA) rescan is still
 * running. Emits a click-to-navigate notification on completion.
 *
 * Jobs have shape:
 *   { id, label, stage, progress 0..1, status: 'running'|'done'|'error',
 *     startedAt, finishedAt, target: { view, elementId } }
 *
 * Progress is stage-based (we don't get real % from the backend). `tick()`
 * runs a gentle easing animation between explicit milestones so the bar
 * keeps moving while the user waits.
 */

const RescanProgressContext = createContext(null);

export function useRescanProgress() {
  const ctx = useContext(RescanProgressContext);
  if (!ctx) {
    throw new Error('useRescanProgress must be used within <RescanProgressProvider>');
  }
  return ctx;
}

export function RescanProgressProvider({ children, onNavigate }) {
  const [jobs, setJobs] = useState({}); // id -> job
  const timers = useRef({}); // id -> intervalId
  const targetProgress = useRef({}); // id -> target number
  const navigateRef = useRef(onNavigate);

  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);

  const clearTimer = useCallback((id) => {
    if (timers.current[id]) {
      clearInterval(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const easeTo = useCallback((id, target) => {
    targetProgress.current[id] = target;
    if (timers.current[id]) return;
    timers.current[id] = setInterval(() => {
      setJobs((prev) => {
        const job = prev[id];
        if (!job || job.status !== 'running') {
          clearTimer(id);
          return prev;
        }
        const goal = targetProgress.current[id] ?? job.progress;
        if (job.progress >= goal - 0.001) {
          clearTimer(id);
          return prev;
        }
        // Ease: move 15% of the remaining distance per tick.
        const next = job.progress + Math.max(0.003, (goal - job.progress) * 0.15);
        return { ...prev, [id]: { ...job, progress: Math.min(next, goal) } };
      });
    }, 120);
  }, [clearTimer]);

  const startJob = useCallback((id, opts = {}) => {
    const job = {
      id,
      label: opts.label || id,
      stage: opts.stage || 'Preparing',
      progress: 0.04,
      status: 'running',
      startedAt: Date.now(),
      finishedAt: null,
      target: opts.target || null,
    };
    setJobs((prev) => ({ ...prev, [id]: job }));
    targetProgress.current[id] = 0.12;
    easeTo(id, 0.12);
  }, [easeTo]);

  const updateJob = useCallback((id, patch) => {
    setJobs((prev) => {
      const job = prev[id];
      if (!job) return prev;
      const next = { ...job, ...patch };
      // If progress is being explicitly set, use it as the new goal too.
      if (typeof patch.progress === 'number') {
        targetProgress.current[id] = patch.progress;
      }
      return { ...prev, [id]: next };
    });
    if (typeof patch.progress === 'number') {
      easeTo(id, patch.progress);
    }
  }, [easeTo]);

  const finishJob = useCallback((id, opts = {}) => {
    clearTimer(id);
    targetProgress.current[id] = 1;
    setJobs((prev) => {
      const job = prev[id];
      if (!job) return prev;
      return {
        ...prev,
        [id]: {
          ...job,
          progress: 1,
          status: opts.error ? 'error' : 'done',
          stage: opts.stage || (opts.error ? 'Failed' : 'Complete'),
          finishedAt: Date.now(),
        },
      };
    });
  }, [clearTimer]);

  const dismissJob = useCallback((id) => {
    clearTimer(id);
    delete targetProgress.current[id];
    setJobs((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [clearTimer]);

  const gotoJobTarget = useCallback((id) => {
    const job = jobs[id];
    if (!job) return;
    const nav = navigateRef.current;
    if (nav && job.target) {
      nav(job.target);
    }
    dismissJob(id);
  }, [jobs, dismissJob]);

  useEffect(() => {
    return () => {
      Object.keys(timers.current).forEach(clearTimer);
    };
  }, [clearTimer]);

  const value = useMemo(() => ({
    jobs,
    jobList: Object.values(jobs).sort((a, b) => b.startedAt - a.startedAt),
    startJob,
    updateJob,
    finishJob,
    dismissJob,
    gotoJobTarget,
    isRunning: (id) => jobs[id]?.status === 'running',
    isAnyRunning: () => Object.values(jobs).some((j) => j.status === 'running'),
  }), [jobs, startJob, updateJob, finishJob, dismissJob, gotoJobTarget]);

  return (
    <RescanProgressContext.Provider value={value}>
      {children}
    </RescanProgressContext.Provider>
  );
}
