// Datos de restaurantes con nombre, url y url imagen
const restaurantData = {
    "cdmx": {
        "polanco": [
            { name: "Restaurante Polanco 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" },
            { name: "Restaurante Polanco 2", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
            // Puedes agregar más restaurantes en Polanco aquí
        ],
        "roma-norte": [
            { name: "Restaurante Roma 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Roma Norte...
        ],
        "condesa": [
            { name: "Restaurante Condesa 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" }
            // Más restaurantes de Condesa...
        ],
        "coyoacan": [
            { name: "Restaurante Coyoacán 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Coyoacán...
        ],
        "santa-fe": [
            { name: "Restaurante Santa Fe 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Santa Fe...
        ]
    },
    "guadalajara": {
        "centro": [
            { name: "Restaurante Centro 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" },
            { name: "Restaurante Centro 2", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
            // Más restaurantes del Centro...
        ],
        "chapalita": [
            { name: "Restaurante Chapalita 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" }
            // Más restaurantes de Chapalita...
        ],
        "providencia": [
            { name: "Restaurante Providencia 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Providencia...
        ],
        "zapopan": [
            { name: "Restaurante Zapopan 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
            // Más restaurantes de Zapopan...
        ]
    },
    "monterrey": {
        "san-pedro-garza-garcia": [
            { name: "Restaurante San Pedro 1", url: "https://tragalero.com/app", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de San Pedro...
        ],
        "centro": [
            { name: "Restaurante Centro Monterrey 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" },
            { name: "Restaurante Centro Monterrey 2", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes del Centro Monterrey...
        ],
        "colonia-del-valle": [
            { name: "Restaurante Colonia del Valle 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Colonia del Valle...
        ],
        "obispado": [
            { name: "Restaurante Obispado 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" }
            // Más restaurantes de Obispado...
        ]
    },
    "puebla": {
        "centro-historico": [
            { name: "Restaurante Centro Histórico 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes del Centro Histórico...
        ],
        "angelopolis": [
            { name: "Restaurante Angelópolis 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
            // Más restaurantes de Angelópolis...
        ],
        "la-paz": [
            { name: "Restaurante La Paz 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de La Paz...
        ]
    },
    "tijuana": {
        "zona-rio": [
            { name: "Restaurante Zona Río 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" },
            { name: "Restaurante Zona Río 2", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
            // Más restaurantes de Zona Río...
        ],
        "playas-de-tijuana": [
            { name: "Restaurante Playas 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" }
            // Más restaurantes de Playas...
        ],
        "otay": [
            { name: "Restaurante Otay 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes de Otay...
        ],
        "centro": [
            { name: "Restaurante Centro Tijuana 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" },
            { name: "Restaurante Centro Tijuana 2", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
            // Más restaurantes del Centro Tijuana...
        ],
        "la-mesa": [
            { name: "Restaurante La Mesa 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
        ],
        "zona-norte": [
            { name: "Restaurante Zona Norte 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
        ],
        "libertad": [
            { name: "Restaurante Libertad 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
        ],
        "20-de-noviembre": [
            { name: "Restaurante 20 de Noviembre 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(18).png" }
        ],
        "santa-fe": [
            { name: "Restaurante Santa Fe 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
        ],
        "florido": [
            { name: "Restaurante Florido 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
        ],
        "el-lago": [
            { name: "Restaurante El Lago 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
        ],
        "villa-del-alamo": [
            { name: "Restaurante Villa del Álamo 1", url: "#", img: "https://menutech.services/assets/img/LA%20COCINA%20DE%20TIJUANA%20(38).png" }
        ],
        "el-soler": [
            { name: "Restaurante El Soler 1", url: "#", img: "https://menutech.services/assets/img/herradero.png" }
        ]
    }
    // Puedes agregar más estados y ciudades de México aquí
};

// Obtener parámetros de URL
const params = new URLSearchParams(window.location.search);
const state = params.get('state');
const city = params.get('city');


const heading = document.getElementById('heading');
const container = document.getElementById('citys');

if (!state || !city || !restaurantData[state] || !restaurantData[state][city]) {
    heading.textContent = "Ciudad no encontrada";
    container.innerHTML = "";
} else {
    heading.textContent = `Restaurantes en ${city.charAt(0).toUpperCase() + city.slice(1)}, ${state.charAt(0).toUpperCase() + state.slice(1)}`;

    // Limpiamos contenido previo
    container.innerHTML = "";

    // Crear contenedor principal .container.linea
    const containerDiv = document.createElement('div');
    containerDiv.className = "container linea";

    // Crear fila .row
    const rowDiv = document.createElement('div');
    rowDiv.className = "row";

    // Recorrer restaurantes y crear estructura con col-4 col-md-4
    restaurantData[state][city].forEach(rest => {
        const colDiv = document.createElement('div');
        colDiv.className = "col-4 col-md-4";

        const a = document.createElement('a');
        a.href = rest.url;
        a.title = rest.name;
        a.target = "_blank";  // Abrir en pestaña nueva

        const img = document.createElement('img');
        img.src = rest.img;
        img.alt = rest.name;
        img.style.width = "100%"; // Ajusta según necesites

        a.appendChild(img);
        colDiv.appendChild(a);
        rowDiv.appendChild(colDiv);
    });

    containerDiv.appendChild(rowDiv);
    container.appendChild(containerDiv);
}
