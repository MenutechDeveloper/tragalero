function setTheme(theme) {
    const themeButtons = document.querySelectorAll('[data-theme-value]');
    const htmlElement = document.documentElement;

    // Apply theme to HTML element
    htmlElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);

    // Update active state in UI
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-theme-value') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update logos based on theme
    const logos = document.querySelectorAll('.logo-img, .login-logo, .navbar-brand img, .logo-main');
    let logoSrc = './assets/img/tragalero.png'; // default dark (white logo)

    if (theme === 'light') {
        logoSrc = './assets/img/tragalero_negro.png';
    } else if (theme === 'medio') {
        logoSrc = './assets/img/tragalero_amarillo.png';
    }

    logos.forEach(img => {
        img.src = logoSrc;
    });

    // Optional: Trigger a custom event for other scripts to respond
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

// Global scope expose
window.setTheme = setTheme;

document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('[data-theme-value]');

    // Load saved theme
    let savedTheme = localStorage.getItem('theme') || 'light';
    const validThemes = ['light', 'dark', 'medio'];
    if (!validThemes.includes(savedTheme)) {
        savedTheme = 'light';
    }
    setTheme(savedTheme);

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme-value');
            setTheme(theme);
        });
    });
});
