import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EditForm, EditRow, EditField, EditTextArea, EditSelect } from './EditFormKit';

const meta = {
  title: 'KoopUI/EditFormKit',
  component: EditForm,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
    layout: 'padded',
  },
} satisfies Meta<typeof EditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormularioBasico: Story = {
  render: () => (
    <EditForm>
      <EditField label="Nombre completo" placeholder="Carlos Pérez" />
      <EditField label="Email" type="email" placeholder="carlos@empresa.co" />
      <EditField label="Teléfono" type="tel" placeholder="+57 300 123 4567" />
    </EditForm>
  ),
};

export const FormularioConColumnas: Story = {
  render: () => (
    <EditForm>
      <EditRow cols={2}>
        <EditField label="Tipo de documento" />
        <EditField label="Número de documento" />
      </EditRow>
      <EditRow cols={2}>
        <EditField label="Fecha de nacimiento" type="date" />
        <EditField label="Ciudad" />
      </EditRow>
      <EditTextArea label="Dirección de notificación" rows={2} placeholder="Cra. 7 # 32-16, Bogotá D.C." />
    </EditForm>
  ),
};

export const FormularioExpediente: Story = {
  render: () => {
    const tipoOptions = [
      { value: 'laboral', label: 'Proceso Laboral' },
      { value: 'civil', label: 'Proceso Civil' },
      { value: 'administrativo', label: 'Proceso Administrativo' },
    ];

    const [form, setForm] = useState({
      numero: '',
      cliente: '',
      tipo: '',
      contraparte: '',
      juzgado: '',
      observaciones: '',
    });

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

    return (
      <EditForm>
        <EditRow cols={2}>
          <EditField label="N° Expediente" value={form.numero} onChange={set('numero')} placeholder="KOOP-2024-001" />
          <EditField label="Cliente" value={form.cliente} onChange={set('cliente')} placeholder="Nombre del cliente" />
        </EditRow>
        <EditSelect
          label="Tipo de proceso"
          value={form.tipo}
          onChange={set('tipo')}
          options={tipoOptions}
          placeholder="Seleccione tipo de proceso"
        />
        <EditField label="Contraparte" value={form.contraparte} onChange={set('contraparte')} placeholder="Nombre de la contraparte" />
        <EditField label="Juzgado o autoridad" value={form.juzgado} onChange={set('juzgado')} placeholder="Juzgado 5 Laboral del Circuito" />
        <EditTextArea
          label="Observaciones"
          value={form.observaciones}
          onChange={set('observaciones')}
          rows={3}
          placeholder="Notas adicionales sobre el caso..."
        />
      </EditForm>
    );
  },
};

export const CampoReadOnly: Story = {
  render: () => (
    <EditForm>
      <EditField label="Email (verificado)" value="carlos@empresa.co" readOnly />
      <EditField label="Nombre" value="Carlos Pérez" />
    </EditForm>
  ),
};
