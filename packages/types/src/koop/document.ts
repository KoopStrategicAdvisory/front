export interface KoopDocument {
  key: string;
  name: string;
  isFolder: boolean;
  downloadURL?: string;
  size?: number;
  lastModified?: string;
  contentType?: string;
  fallbackUrl?: string;
}
