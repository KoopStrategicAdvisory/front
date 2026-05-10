import { useState, useEffect, useCallback } from 'react';
import type {
  KoopTask,
  TaskFilters,
  TaskPagination,
  TaskStats,
} from '@repo/types';

export interface TasksApiClient {
  listTasks(
    params?: Partial<TaskFilters & { page: number; limit: number }>
  ): Promise<{ tasks: KoopTask[]; pagination: TaskPagination; stats?: TaskStats | null }>;
  getTask(id: string): Promise<{ task: KoopTask }>;
  createTask(data: Partial<KoopTask>): Promise<KoopTask>;
  updateTask(id: string, data: Partial<KoopTask>): Promise<KoopTask>;
  deleteTask(id: string): Promise<void>;
  addComment(id: string, text: string): Promise<unknown>;
  getDashboardStats(): Promise<{ stats: TaskStats; recentTasks: KoopTask[] }>;
}

export function useTasks(client: TasksApiClient, initialFilters: Partial<TaskFilters> = {}) {
  const [tasks, setTasks] = useState<KoopTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TaskPagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [filters, setFilters] = useState<Partial<TaskFilters>>(initialFilters);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<KoopTask[]>([]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listTasks({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTasks(data.tasks ?? []);
      setPagination((p) => ({ ...p, ...(data.pagination ?? {}) }));
      setStats(data.stats ?? null);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error).message ?? 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  }, [client, filters, pagination.page, pagination.limit]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await client.getDashboardStats();
      setStats(data.stats);
      setRecentTasks(data.recentTasks ?? []);
    } catch {
      // non-critical
    }
  }, [client]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (taskData: Partial<KoopTask>) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await client.createTask(taskData);
      await fetchTasks();
      return newTask;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error).message ?? 'Error al crear tarea';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fetchTasks]);

  const updateTask = useCallback(async (id: string, taskData: Partial<KoopTask>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await client.updateTask(id, taskData);
      await fetchTasks();
      return updated;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error).message ?? 'Error al actualizar tarea';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.deleteTask(id);
      await fetchTasks();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error).message ?? 'Error al eliminar tarea';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fetchTasks]);

  const addComment = useCallback(async (id: string, text: string) => {
    try {
      const result = await client.addComment(id, text);
      await fetchTasks();
      return result;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error).message ?? 'Error al agregar comentario';
      setError(msg);
      throw err;
    }
  }, [client, fetchTasks]);

  const changeTaskStatus = useCallback(
    (id: string, status: KoopTask['status']) => updateTask(id, { status }),
    [updateTask]
  );

  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const changePage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [initialFilters]);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(() => {
    fetchTasks();
    fetchDashboardStats();
  }, [fetchTasks, fetchDashboardStats]);

  const getTask = useCallback(async (id: string) => {
    const data = await client.getTask(id);
    return data.task;
  }, [client]);

  const getUpcomingTasks = useCallback(() => {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completada') return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= threeDays;
    });
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completada') return false;
      return new Date(t.dueDate) < now;
    });
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    pagination,
    filters,
    stats,
    recentTasks,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    changeTaskStatus,
    getTask,
    updateFilters,
    changePage,
    resetFilters,
    clearError,
    refresh,
    fetchTasks,
    fetchDashboardStats,
    getUpcomingTasks,
    getOverdueTasks,
  };
}
