import type { User, UserPublic } from '../usuario';
import { mockRole } from './catalogos.mock';

export const mockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  nombre: 'Felipe Rey',
  email: 'felipe@koopstrategicadvisory.com',
  active: true,
  roles: [mockRole()],
  ...overrides,
});

export const mockUserPublic = (overrides?: Partial<UserPublic>): UserPublic =>
  mockUser(overrides);

export const mockAbogado = (overrides?: Partial<User>): User =>
  mockUser({
    id: 2,
    nombre: 'Laura Gómez',
    email: 'laura@koopstrategicadvisory.com',
    roles: [mockRole({ id: 2, nombre: 'lawyer' })],
    cargo: 'Abogada Senior',
    especialidades: 'Derecho Laboral, Derecho Administrativo',
    ...overrides,
  });

/** Usuario con rol `client` (distinto de la entidad `Cliente` de `cliente.mock.ts`) */
export const mockUsuarioCliente = (overrides?: Partial<User>): User =>
  mockUser({
    id: 3,
    nombre: 'Carlos Pérez',
    email: 'carlos@empresa.co',
    roles: [mockRole({ id: 3, nombre: 'client' })],
    ...overrides,
  });
