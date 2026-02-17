
import React from 'react';
import { Birthday, EconomicIndicator, LegalRegulation } from './types';

export const MOCK_INDICATORS: EconomicIndicator[] = [
  { name: 'IPC Mensual', value: '0.4%', change: 0.1, trend: 'up' },
  { name: 'Dólar (USD)', value: '$945.2', change: -2.5, trend: 'down' },
  { name: 'UTM', value: '$65.182', change: 0.2, trend: 'up' },
  { name: 'Precio KWh Prom.', value: '$112', change: 0, trend: 'neutral' },
];

export const MOCK_BIRTHDAYS: Birthday[] = [
  { name: 'Andrea Valenzuela', date: 'Hoy', department: 'Operaciones', photo: 'https://picsum.photos/seed/andrea/100/100' },
  { name: 'Roberto Méndez', date: 'Mañana', department: 'Finanzas', photo: 'https://picsum.photos/seed/roberto/100/100' },
  { name: 'Claudia Soto', date: '15 Oct', department: 'RRHH', photo: 'https://picsum.photos/seed/claudia/100/100' },
];

export const MOCK_LEGAL: LegalRegulation[] = [
  { title: 'Ley de Eficiencia Energética 21.305', status: 'Vigente', category: 'Normativa General' },
  { title: 'Modificación Reglamento RRHH v2.4', status: 'En revisión', category: 'Interno' },
  { title: 'Protocolo de Seguridad Eléctrica', status: 'Nueva', category: 'Seguridad' },
];

export const COLORS = {
  blue: '#1c26ba',
  cyan: '#00eed5',
  gray: '#f8fafc',
};
