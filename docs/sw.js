// Se ejecuta al instalar el service worker (solo una vez)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activa el service worker sin esperar
});

// Se ejecuta al activar el service worker (después de instalar)
self.addEventListener('activate', (event) => {
  clients.claim(); // Toma el control de todas las pestañas
});

// Se activa en cada solicitud de recursos (HTML, CSS, JS, etc.)
self.addEventListener('fetch', () => {
  // No hace nada por ahora, pero puedes manejar caché aquí si lo deseas
});
