// Legacy bridge for menutechUI.js -> tragaleroUI.js
if (!window.TragaleroUI) {
    const script = document.createElement('script');
    script.src = './tragaleroUI.js';
    document.head.appendChild(script);
}
