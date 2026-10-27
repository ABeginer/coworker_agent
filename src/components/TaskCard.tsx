'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import { formatTaskDate, getStatusBadgeConfig } from '@/lib/task-utils';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const statusConfig = getStatusBadgeConfig(task.status);

  const handleCopy = async () => {
    if (!task.ai_output) return;

    try {
      await navigator.clipboard.writeText(task.ai_output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const formattedDate = formatTaskDate(task.created_at);

  return (
    <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header: ID, Title & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
              #{task.id}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {task.title}
          </h3>
        </div>

        {/* Status Badge */}
        <div className="flex items-center self-start sm:self-auto shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeClass}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line mb-4">
        {task.description}
      </p>

      {/* AI Output Section */}
      {task.ai_output ? (
        <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 overflow-hidden">
          {/* Header of AI Output Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>AI Agent Output</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy AI output to clipboard"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse output' : 'Expand output'}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible preformatted output */}
          {isExpanded && (
            <div className="p-4 overflow-x-auto max-h-96">
              <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                <code>{task.ai_output}</code>
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          {task.status === 'in_progress' ? (
            <span className="text-blue-500 font-medium">Agent is executing task and processing outputs...</span>
          ) : task.status === 'pending' ? (
            <span>Queued in pipeline. Awaiting available agent worker...</span>
          ) : (
            <span>No output data returned for this task.</span>
          )}
        </div>
      )}
    </article>
  );
}

export default TaskCard;
