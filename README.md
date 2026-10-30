# Masajes y recuperación muscular · Lanús Oeste

Sitio de una sola página hecho con **Angular 22**, TypeScript, HTML y CSS (sin librerías de UI).
Incluye sesiones con precio, mapa con radio de atención (sin marcar la dirección) y reserva de turno por WhatsApp.

## Requisitos

- Node.js 22.12 o superior
- npm

## Uso

```bash
npm install
npm start        # desarrollo en http://localhost:4200
npm run build    # producción, sale en dist/masajes-lanus-oeste/browser
```

La carpeta `dist/.../browser` se sube tal cual a cualquier hosting estático.
Si el sitio no queda en la raíz del dominio, compilar con `npx ng build --base-href /ruta/`.

## Qué editar

Todo está en `src/app/core/site.config.ts`:

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp | `SITE.whatsapp` |
| Días, horario de atención, duración del turno | `SITE.schedule` |
| Sesiones, duración y **precios** | `SERVICES` |
| Aviso "Precios de ejemplo" | `SITE.pricesAreExample` (poner `false` con precios reales) |
| Formación, contactos (Instagram) | `TRAINING`, `CONTACTS` |
| Centro, radio y etiqueta del mapa | `SITE.zone` |

Los precios cargados son de ejemplo y hay que reemplazarlos.

## Mapa y privacidad

- El mapa dibuja solo un círculo; no hay marcador.
- El centro del círculo está **desplazado a propósito** de la dirección real. Verificá que tu domicilio quede dentro del radio y no en el centro; si no, ajustá `center` y `radiusMeters`.
- No escribas la dirección real en ningún archivo del proyecto: el código es público.
- Los mosaicos vienen de OpenStreetMap. Funcionan en un sitio publicado (http/https); abriendo los archivos desde el disco el servidor de mapas puede bloquearlos. Sin conexión se muestra un mapa esquemático.

## Cómo funciona la reserva

1. La persona elige sesión, día y horario, y escribe su nombre.
2. Los horarios dependen de la duración de la sesión y del horario de atención.
3. El botón abre WhatsApp con el mensaje armado (sesión, día, horario, precio, nombre y comentarios).

No hay backend ni agenda: la página no sabe qué horarios ya están ocupados. El turno queda confirmado cuando respondés por WhatsApp.

## Estructura

```
src/app/
  core/       configuración, modelos, fechas y estado de la reserva (signals)
  shared/     íconos, directiva de aparición, pipe de precios
  sections/   header, hero, servicios, horarios, formación, zona, reserva, footer
```
