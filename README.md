# Masajes y recuperación muscular · Lanús Oeste

Aplicación web para consultar servicios de masajes, conocer las modalidades de atención y solicitar turnos de manera online.

Desarrollada con Angular 22 y TypeScript, con una interfaz adaptable a dispositivos móviles y computadoras.

## Características

- Presentación de los servicios disponibles.
- Información sobre masajes deportivos y descontracturantes.
- Información sobre recuperación muscular.
- Consulta de horarios y disponibilidad.
- Solicitud de turnos online.
- Integración con WhatsApp para facilitar el contacto.
- Mapa de zona de atención con ubicación aproximada, preservando la dirección particular.
- Diseño responsive.

## Tecnologías

- Angular 22
- TypeScript 6
- Bootstrap 5
- Bootstrap Icons
- Supabase
- Leaflet
- Playwright

## Requisitos

- Node.js 22.12 o superior.
- npm.

## Instalación

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar al proyecto:

```bash
cd page-masajes
```

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm start
```

La aplicación estará disponible en:

http://localhost:4200/

## Compilación

Generar la versión de producción:

```bash
npm run build
```

Los archivos compilados se generan en:

```text
dist/masajes-lanus-oeste/browser/
```

## Pruebas

El proyecto utiliza Playwright para realizar pruebas automatizadas de extremo a extremo (E2E).

Ejecutar todas las pruebas:

```bash
npx playwright test
```

Visualizar el informe:

```bash
npx playwright show-report
```

## Estructura general

```text
src/
├── app/
│   ├── core/
│   ├── public/
│   └── ...
├── environments/
├── index.html
└── styles.css

e2e/
├── pages/
├── support/
└── tests/
```

## Privacidad y configuración

La aplicación utiliza una ubicación aproximada para representar la zona de atención. No se publica la dirección particular.

La configuración de conexión utiliza una clave pública de Supabase. Las claves privadas y credenciales sensibles no deben incluirse en el repositorio.

## Estado del proyecto

Proyecto en desarrollo, con funcionalidades de consulta de servicios y solicitud de turnos, pruebas automatizadas y proceso de integración continua mediante GitHub Actions.