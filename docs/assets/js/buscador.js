function mostrarRestaurantes(radio, filtroNombre = "") {
    const grid = document.getElementById('restaurantsGrid');
    grid.innerHTML = "";

    let lista = restaurantes;

    // Si hay texto en el buscador, ignoramos el radio y mostramos todos
    if (filtroNombre.trim() === "") {
        // Filtrar por radio (si tenemos ubicación)
        if (latUser !== null && lonUser !== null && radio < 9999) {
            lista = lista
                .map(r => {
                    const distancia = calcularDistancia(latUser, lonUser, r.lat, r.lon);
                    return { ...r, distancia };
                })
                .filter(r => r.distancia <= radio)
                .sort((a, b) => a.distancia - b.distancia);
        }
    } else {
        // Si hay texto, buscar en todos los restaurantes y poner "Todos" en el selector
        document.getElementById('radioBusqueda').value = "9999";
        lista = restaurantes.filter(r => r.nombre.toLowerCase().includes(filtroNombre.toLowerCase()));
    }

    // Mostrar resultados o mensaje
    if (lista.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.textContent = "No se encontraron restaurantes.";
        mensaje.style.textAlign = "center";
        mensaje.style.color = "#555";
        mensaje.style.padding = "20px 0";
        grid.appendChild(mensaje);
    } else {
        lista.forEach(r => {
            const link = document.createElement('a');
            link.href = r.url;
            link.innerHTML = `<img src="${r.imagen}" alt="${r.nombre}">`;
            grid.appendChild(link);
        });
    }
}

// Detectar ubicación
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            latUser = pos.coords.latitude;
            lonUser = pos.coords.longitude;
            mostrarRestaurantes(parseInt(document.getElementById('radioBusqueda').value));
        },
        () => mostrarRestaurantes(9999)
    );
} else {
    mostrarRestaurantes(9999);
}

// Evento para cambiar radio
document.getElementById('radioBusqueda').addEventListener('change', function() {
    mostrarRestaurantes(
        parseInt(this.value),
        document.getElementById('searchInput').value
    );
});

// Evento para buscar en tiempo real
document.getElementById('searchInput').addEventListener('input', function() {
    mostrarRestaurantes(
        parseInt(document.getElementById('radioBusqueda').value),
        this.value
    );
});
