import { Contact } from './models';

export const SITE = {
  whatsapp: {
    number: '5491167597638',
    display: '+54 9 11 6759-7638',
  },

  zone: {
    center: [-34.7023, -58.3952] as [number, number],
    radiusMeters: 700,
    label: 'Radio de atención MYO',
  },
};

export const CONTACTS: Contact[] = [
  { name: 'WhatsApp', value: SITE.whatsapp.display, icon: 'whatsapp', href: `https://wa.me/${SITE.whatsapp.number}` },
  { name: 'Instagram', value: '@masajesconeze', icon: 'instagram', href: 'https://www.instagram.com/masajesconeze' },
];
