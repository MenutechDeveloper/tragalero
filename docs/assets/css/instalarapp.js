let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');

  // El navegador lanza este evento SOLO si la PWA es instalable
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Opcional: podrías agregar una clase para indicar que está activo
    installBtn.classList.add('instalable');
  });

  // Al hacer clic en el botón
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

   if (choiceResult.outcome === 'accepted') {
  console.log('✅ User accepted to install the app');
} else {
  console.log('❌ User declined the installation');
}

      deferredPrompt = null;
    } else {
      // Si no hay instalación disponible
      alert('This app is already installed');
    }
  });
});










