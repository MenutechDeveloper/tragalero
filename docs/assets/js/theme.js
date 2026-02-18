document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('[data-theme-value]');
    const htmlElement = document.documentElement;

    // Load saved theme
    let savedTheme = localStorage.getItem('theme') || 'light';
    // Validate theme (remove old ones like 'pastel')
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

    function setTheme(theme) {
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

        // Optional: Trigger a custom event for other scripts to respond
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
});
