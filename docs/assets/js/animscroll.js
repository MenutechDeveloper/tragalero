function activarAnimacionesScroll() {
  const steps = document.querySelectorAll('.step');
  if (!steps.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0.2 });

  steps.forEach(step => observer.observe(step));
}
