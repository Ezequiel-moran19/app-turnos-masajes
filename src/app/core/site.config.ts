import { Contact, ScheduleConfig, Service, Treatment} from './models';

export const SITE = {
  brand: 'Masajes & Bienestar',

  whatsapp: {
    number: '5491167597638',
    display: '+54 9 11 6759-7638',
  },

  schedule: {
    days: [1, 2, 3, 4, 5],
    open: '09:00',
    close: '18:00',
    stepMinutes: 60,
    horizonDays: 14,
    leadMinutes: 60,
  } satisfies ScheduleConfig,

  pricesAreExample: false,

  zone: {
    center: [-34.7023, -58.3952] as [number, number],
    radiusMeters: 700,
    label: 'Radio de atención MYO',
  },
};

export const SERVICES: Service[] = [
  {
    name: 'Sesión de masajes',
    description: 'Sesión de una hora.',
    duration: '60 min',
    minutes: 60,
    price: 25000,
    icon: 'hand',
    image: '/cards/Espalda.jpg',
  },
];

export const UNDECIDED: Service = {
  name: 'Todavía no sé cuál elegir',
  description: '',
  duration: '60 min',
  minutes: 60,
  price: 25000,
  icon: 'hand',
  image: '/cards/Espalda.jpg',
};

export const TREATMENTS: Treatment[] = [
  {
    name: 'Masaje deportivo',
    description:
      'Masaje adaptado a la actividad física y a las necesidades musculares.',
    image: '/cards/Espalda.jpg',
  },
  {
    name: 'Terapia con ventosas',
    description:
      'Técnica complementaria aplicada según las necesidades de cada persona.',
    image: '/cards/Ventosa.jpg',
  },
  {
    name: 'Lámpara infrarroja',
    description:
      'Aplicación de calor superficial como complemento de la sesión.',
    image: '/cards/lampara.jpg',
  },
];

export const CONTACTS: Contact[] = [
  {
    name: 'WhatsApp',
    value: SITE.whatsapp.display,
    icon: 'whatsapp',
    href: `https://wa.me/${SITE.whatsapp.number}`,
  },
  {
    name: 'Instagram',
    value: '@masajesconeze',
    icon: 'instagram',
    href: 'https://www.instagram.com/masajesconeze?dlrf=aTA0NzliNzB3NWJ2',
  },
];

// {
//   name: 'Magnetoterapia',
//   description: 'Aplicación de magnetoterapia como complemento de la sesión.',
//   image: '/cards/Magneto-1.jpg',
// },
// export const TRAINING: Training[] = [
//   { name: 'Instituto APC', description: 'Masaje integral, circulatorio, sedativo y descontracturante; piernas cansadas y cuidados para tercera edad.', icon: 'book' },
//   { name: 'Equipamiento de apoyo', description: 'Ultrasonido 3 MHz, ondas rusas, lámpara infrarroja, parafina y almohadillas con hierbas.', icon: 'shield' },
//   { name: 'Masaje deportivo y anatomía', description: 'Anatomía y fisiología, sistema muscular y nervioso, biomecánica, masaje pre y post competitivo y vendajes.', icon: 'cycle' },
//   { name: 'Criterio profesional', description: 'Reconocer contraindicaciones y sugerir una evaluación profesional cuando hace falta.', icon: 'user' },
// ];