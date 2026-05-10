/**
 * Re-exporta useTasks de @repo/hooks inyectando el cliente axios de koop.
 * La lógica reside en el package compartido; este archivo solo construye el cliente.
 */
import { useTasks as useTasksBase } from '@repo/hooks';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  getDashboardStats,
} from '../api/tasks';

const tasksApiClient = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment: addTaskComment,
  getDashboardStats,
};

export function useTasks(initialFilters = {}) {
  return useTasksBase(tasksApiClient, initialFilters);
}
