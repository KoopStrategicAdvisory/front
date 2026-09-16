// Clasifica un documento por su mime_type (o extensión, si el mime no vino)
// para poder mostrar un icono/color consistente y decidir si se puede
// previsualizar en el navegador (imágenes y PDF sí; el resto solo se descarga).
const KIND_BY_EXT = {
  pdf: 'pdf',
  doc: 'word', docx: 'word', rtf: 'word', odt: 'word',
  xls: 'excel', xlsx: 'excel', csv: 'excel', ods: 'excel',
  ppt: 'powerpoint', pptx: 'powerpoint', odp: 'powerpoint',
  zip: 'zip', rar: 'zip', '7z': 'zip',
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
};

export const FILE_KIND_META = {
  image: { icon: '🖼️', label: 'Imagen', color: '#a78bfa' },
  pdf: { icon: '📕', label: 'PDF', color: '#f87171' },
  word: { icon: '📘', label: 'Word', color: '#60a5fa' },
  excel: { icon: '📗', label: 'Excel', color: '#34d399' },
  powerpoint: { icon: '📙', label: 'PowerPoint', color: '#fb923c' },
  zip: { icon: '🗜️', label: 'Comprimido', color: '#facc15' },
  other: { icon: '📄', label: 'Archivo', color: '#9ca3af' },
};

export function fileKind(mimeType, filename) {
  const mime = String(mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('word')) return 'word';
  if (mime.includes('sheet') || mime.includes('excel')) return 'excel';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'powerpoint';
  if (mime.includes('zip') || mime.includes('compressed')) return 'zip';

  const ext = String(filename || '').split('.').pop()?.toLowerCase();
  return KIND_BY_EXT[ext] || 'other';
}

export function canPreview(kind) {
  return kind === 'image' || kind === 'pdf';
}
