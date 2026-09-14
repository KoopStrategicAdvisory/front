import type { Cliente } from '../cliente';

export const mockCliente = (overrides?: Partial<Cliente>): Cliente => ({
  id: 1,
  nombre: 'Carlos Pérez',
  tipo_persona: 'NATURAL',
  tipo_documento: 'CC',
  numero_documento: '1010101010',
  email: 'carlos@empresa.co',
  telefono: '+57 300 123 4567',
  active: true,
  ...overrides,
});

export const mockClienteList = (count = 3): Cliente[] =>
  Array.from({ length: count }, (_, i) =>
    mockCliente({ id: i + 1, nombre: `Cliente ${i + 1}` })
  );
