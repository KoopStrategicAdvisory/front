export type TaskStatus = 'pendiente' | 'en-curso' | 'completada' | 'cancelada';
export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TaskCategory =
  | 'laboral'
  | 'civil'
  | 'penal'
  | 'administrativo'
  | 'tributario'
  | 'comercial'
  | 'familia'
  | 'otro';

export interface TaskComment {
  id?: string;
  text: string;
  createdAt?: string;
  author?: string;
}

export interface KoopTask {
  id: string;
  title: string;
  description?: string;
  client?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  radicado?: string;
  comments?: TaskComment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  client?: string;
  assignedTo?: string;
  search?: string;
  overdue?: string;
  upcoming?: string;
  mine?: string;
}

export interface TaskPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TaskStats {
  total?: number;
  pending?: number;
  inProgress?: number;
  completed?: number;
  overdue?: number;
  [key: string]: unknown;
}
