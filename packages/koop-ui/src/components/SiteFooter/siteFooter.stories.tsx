import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SiteFooter } from './SiteFooter';

const serviceLinks = [
  { label: 'Derecho Laboral', href: '/derecho-laboral' },
  { label: 'Derecho de Familia', href: '/derecho-familia' },
  { label: 'Derecho Penal', href: '/derecho-penal' },
  { label: 'Contabilidad', href: '/contabilidad' },
  { label: 'Auditoría', href: '/auditoria' },
];

const meta = {
  title: 'KoopUI/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
  },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Marketing: Story = {
  args: {
    variant: 'marketing',
    brandCopy: 'Asesoría jurídica y contable de alto nivel para empresas y personas naturales en Colombia.',
    ctaHeading: '¿Necesita orientación legal?',
    whatsappHref: 'https://wa.me/573137213878',
    emailHref: 'mailto:direccionjuridicakoop@hotmail.com',
    serviceLinks,
  },
};

export const MarketingSinServicios: Story = {
  args: {
    variant: 'marketing',
    brandCopy: 'Asesoría jurídica y contable de alto nivel.',
    ctaHeading: '¿Listo para comenzar?',
    whatsappHref: 'https://wa.me/573137213878',
  },
};

export const Simple: Story = {
  args: {
    variant: 'simple',
    simpleLeftText: 'Koop Strategic Advisory',
    simpleRightLinks: [
      { label: 'Política de Privacidad', href: '/privacidad' },
      { label: 'Términos', href: '/terminos' },
    ],
  },
};
