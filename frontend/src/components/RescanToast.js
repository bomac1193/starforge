import React, { useEffect, useState } from 'react';
import { useRescanProgress } from '../context/RescanProgressContext';

/**
 * Compact top-right progress strip for background rescan jobs.
 *
 * - While any job is running, shows a stack of slim bars with the current
 *   stage label and animated progress.
 * - On completion, the row turns into a clickable notification that
 *   navigates to the job's target (e.g. the Visual DNA card) and dismisses.
 * - Completed jobs auto-dismiss after 20s if untouched.
 */
export default function RescanToast() {
  const { jobList, gotoJobTarget, dismissJob } = useRescanProgress();

  // Auto-dismiss completed jobs after 20s
  useEffect(() => {
    const timers = jobList
      .filter((j) => j.status !== 'running' && j.finishedAt)
      .map((j) => setTimeout(() => dismissJob(j.id), 20000));
    return () => timers.forEach(clearTimeout);
  }, [jobList, dismissJob]);

  if (jobList.length === 0) return null;

  return (
    <div
      className="fixed z-50 flex flex-col gap-2 pointer-events-none"
      style={{ top: 20, right: 20, width: 260 }}
    >
      {jobList.map((job) => (
        <ToastRow key={job.id} job={job} onClick={() => gotoJobTarget(job.id)} onClose={() => dismissJob(job.id)} />
      ))}
    </div>
  );
}

function ToastRow({ job, onClick, onClose }) {
  const [closing, setClosing] = useState(false);
  const isRunning = job.status === 'running';
  const isError = job.status === 'error';
  const clickable = !isRunning && !isError && !!job.target;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!clickable) return;
    setClosing(true);
    onClick();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      onClick={handleClick}
      className={`pointer-events-auto border bg-brand-bg transition-all duration-300 ${
        closing ? 'opacity-0 translate-x-2' : 'opacity-100'
      } ${
        clickable
          ? 'border-brand-text cursor-pointer hover:bg-brand-text hover:text-white'
          : 'border-brand-border'
      }`}
      style={{ padding: '10px 12px' }}
      title={clickable ? 'Click to view' : job.stage}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-body-xs uppercase tracking-wider truncate ${
          isError ? 'text-brand-secondary' : 'text-brand-text'
        }`}>
          {job.label}
        </span>
        <button
          onClick={handleClose}
          className="text-body-xs text-brand-secondary hover:text-brand-text flex-shrink-0"
          aria-label="Dismiss"
          style={{ lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div className="h-[2px] w-full bg-brand-border overflow-hidden">
        <div
          className={`h-full transition-all ease-out ${
            isError ? 'bg-brand-secondary' : 'bg-brand-text'
          }`}
          style={{
            width: `${Math.round((job.progress || 0) * 100)}%`,
            transitionDuration: isRunning ? '180ms' : '300ms',
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-body-xs text-brand-secondary truncate">
          {isError ? 'Failed' : isRunning ? job.stage : clickable ? 'Tap to view' : job.stage}
        </span>
        <span className="text-body-xs text-brand-secondary font-mono flex-shrink-0 ml-2">
          {Math.round((job.progress || 0) * 100)}%
        </span>
      </div>
    </div>
  );
}
