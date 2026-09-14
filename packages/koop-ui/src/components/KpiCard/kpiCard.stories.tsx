import type { Meta, StoryObj } from '@storybook/react';
import { KpiCard } from './KpiCard';

const meta = {
  title: 'KoopUI/KpiCard',
  component: KpiCard,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
  },
} satisfies Meta<typeof KpiCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Casos activos',
    value: 12,
  },
};

export const ConHint: Story = {
  args: {
    label: 'Tareas pendientes',
    value: 7,
    hint: '3 son hitos preclusivos',
  },
};

export const Honorarios: Story = {
  args: {
    label: 'Honorarios cobrados',
    value: '$ 4.500.000',
    hint: 'Mes de mayo 2026',
  },
};

export const SinDatos: Story = {
  args: {
    label: 'Audiencias programadas',
    value: 0,
    hint: 'No hay audiencias próximas',
  },
};
