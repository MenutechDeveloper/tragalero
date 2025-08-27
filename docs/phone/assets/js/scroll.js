const textos = document.querySelectorAll('.texto-observable');
const triggerMargin = 450;
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  textos.forEach(texto => {
    const rect = texto.getBoundingClientRect();
    const isEntering = rect.top < window.innerHeight - triggerMargin && rect.bottom > triggerMargin;

    // Remueve ambos fade-outs antes de aplicar nuevo estado
    texto.classList.remove('fade-out-left', 'fade-out-right');

    if (isEntering) {
      texto.classList.add('active');
    } else {
      texto.classList.remove('active');

      // Agrega fade-out según el tipo original
      if (texto.classList.contains('fade-left')) {
        texto.classList.add('fade-out-left');
      } else if (texto.classList.contains('fade-right')) {
        texto.classList.add('fade-out-right');
      }
    }
  });

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});