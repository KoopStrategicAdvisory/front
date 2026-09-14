import type { Id } from './shared';
import type { CatalogItem } from './catalogos';

export interface User {
  id: Id;
  nombre: string;
  email: string;
  active: boolean;
  cargo?: string;
  especialidades?: string;
  tarifa_hora?: number;
  moneda_tarifa?: string;
  last_login?: string;
  created_at?: string;
  roles: CatalogItem[];
}

/** Subset seguro del usuario para uso en UI (idéntico a `User` — el backend ya no expone
 * campos sensibles en `/users`, a diferencia del password hash del modelo legacy) */
export type UserPublic = User;

export type CreateUserInput = Pick<User, 'nombre' | 'email'> & { password: string };

export type UpdateUserInput = Partial<
  Pick<User, 'nombre' | 'email' | 'active' | 'cargo' | 'especialidades' | 'tarifa_hora' | 'moneda_tarifa'>
>;

export interface AuthResponse {
  accessToken: string;
  user: UserPublic;
}
