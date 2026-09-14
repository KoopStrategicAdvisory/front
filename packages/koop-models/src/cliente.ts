import type { Id } from './shared';

export type TipoPersonaCliente = 'NATURAL' | 'JURIDICA';
export type TipoDocumentoCliente = 'CC' | 'CE' | 'PA' | 'NIT' | 'TI' | 'PE';

export interface Cliente {
  id: Id;
  nombre: string;
  tipo_persona?: TipoPersonaCliente;
  tipo_documento?: TipoDocumentoCliente;
  numero_documento?: string;
  email?: string;
  telefono?: string;
  active: boolean;
}

export type CreateClienteInput = Pick<Cliente, 'nombre'> & {
  tipo_persona?: TipoPersonaCliente;
  tipo_documento?: TipoDocumentoCliente;
  numero_documento?: string;
  email?: string;
  telefono?: string;
};

export type UpdateClienteInput = Partial<CreateClienteInput>;
