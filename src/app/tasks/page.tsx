'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Task, TaskStatus } from '@/types/task';
import { TaskForm } from '@/components/TaskForm';
import { TaskCard } from '@/components/TaskCard';
import { isBigIntSafe } from '@/lib/task-utils';
import {
  Activity,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

/**
 * Normalises a Postgres BIGINT id for React keys: "42" and 42 collapse to the
 * same key, while ids beyond 2^53 stay as raw strings (never lossily rounded).
 */
const taskKey = (id: string | number): string =>
  isBigIntSafe(id) ? String(Number(id)) : String(id);

export default function TasksDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch initial tasks from Supabase
  const fetchTasks = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setFetchError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, ai_output, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setTasks(data ? (data as Task[]) : []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to fetch tasks from Supabase.';
      setFetchError(message);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
    let isMounted = true;

    // 1. Initial Fetch
    fetchTasks();

    // 2. Real-time Subscription Setup
    try {
      const supabase = createClient();

      channel = supabase
        .channel('tasks-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          (payload) => {
            if (!isMounted) return;

            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task;
              setTasks((prev) => [
                newTask,
                ...prev.filter((t) => String(t.id) !== String(newTask.id)),
              ]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as Task;
              setTasks((prev) =>
                prev.map((t) => (String(t.id) === String(updatedTask.id) ? updatedTask : t))
              );
            } else if (payload.eventType === 'DELETE') {
              const oldTask = payload.old as Partial<Task>;
              setTasks((prev) =>
                oldTask.id == null
                  ? prev
                  : prev.filter((t) => String(t.id) !== String(oldTask.id))
              );
            }
          }
        )
        .subscribe((status) => {
          if (isMounted) {
            setIsLiveConnected(status === 'SUBSCRIBED');
          }
        });
    } catch (err) {
      console.error('Real-time subscription initialization error:', err);
    }

    // 3. Proper Cleanup on Unmount
    return () => {
      isMounted = false;
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // Client instance teardown
        }
      }
    };
  }, []);

  // Compute status metrics
  const metrics = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };
  }, [tasks]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'all' ? true : task.status === statusFilter;
      const matchesSearch =
        searchQuery.trim() === ''
          ? true
          : task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Agent Swarm Control</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Real-Time Task Management & AI Output Stream
              </p>
            </div>
          </div>

          {/* Real-time Indicator & Controls */}
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isLiveConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isLiveConnected ? 'animate-pulse text-emerald-500' : 'text-amber-500'
                }`}
              />
              <span>{isLiveConnected ? 'Realtime Connected' : 'Syncing Stream...'}</span>
            </div>

            <button
              onClick={() => fetchTasks(true)}
              disabled={isRefreshing}
              title="Refresh task stream"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Metric Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
              <span>Total Tasks</span>
              <Layers className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs mb-1">
              <span>Pending Queue</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.pending}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs mb-1">
              <span>In Progress</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.inProgress}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </div>
          </div>
        </section>

        {/* Dashboard Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column / Sidebar: Task Submission Form */}
          <section className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <TaskForm />
          </section>

          {/* Right Column: Task Feed with Search and Filtering */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks by title or instructions..."
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtered ({filteredTasks.length})</span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(
                  [
                    { id: 'all', label: 'All', count: metrics.total },
                    { id: 'pending', label: 'Pending', count: metrics.pending },
                    { id: 'in_progress', label: 'In Progress', count: metrics.inProgress },
                    { id: 'completed', label: 'Completed', count: metrics.completed },
                    { id: 'failed', label: 'Failed', count: metrics.failed },
                  ] as const
                ).map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message if Initial Query Failed */}
            {fetchError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to load tasks from Supabase</p>
                  <p className="text-xs leading-relaxed">{fetchError}</p>
                  <p className="text-xs text-rose-500 pt-1">
                    Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are
                    configured and the `tasks` table exists.
                  </p>
                </div>
              </div>
            )}

            {/* Task Feed List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskCard key={taskKey(task.id)} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  No tasks found
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No tasks match your current filter or search criteria.'
                    : 'Get started by creating your first agent task using the form.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
