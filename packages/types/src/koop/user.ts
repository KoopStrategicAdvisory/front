export type KoopRole = 'admin' | 'lawyer' | 'user' | 'client';

export interface KoopUser {
  id: string;
  name: string | null;
  email: string | null;
  roles: KoopRole[];
  active: boolean;
  driveFolders: string[];
}
