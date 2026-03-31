const directoryData = [
    {
        name: "El Herradero",
        city: "CDMX",
        state: "Polanco",
        zip: "11560",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=El+Herradero",
        menuUrl: "https://tragalero.com/menu/el-herradero",
        latitude: 19.4326,
        longitude: -99.1332
    },
    {
        name: "Alex's Tacos",
        city: "Tijuana",
        state: "Zona Río",
        zip: "22010",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Alexs+Tacos",
        menuUrl: "https://tragalero.com/menu/alexs-tacos",
        latitude: 32.5149,
        longitude: -117.0382
    },
    {
        name: "Sushi Roll",
        city: "Guadalajara",
        state: "Zapopan",
        zip: "45010",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Sushi+Roll",
        menuUrl: "https://tragalero.com/menu/sushi-roll",
        latitude: 20.6744,
        longitude: -103.3440
    },
    {
        name: "La Pizzería",
        city: "Monterrey",
        state: "San Pedro",
        zip: "66220",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=La+Pizzeria",
        menuUrl: "https://tragalero.com/menu/la-pizzeria",
        latitude: 25.6866,
        longitude: -100.3161
    },
    {
        name: "Hacienda Teya",
        city: "Mérida",
        state: "Yucatán",
        zip: "97000",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Hacienda+Teya",
        menuUrl: "https://tragalero.com/menu/hacienda-teya",
        latitude: 20.9676,
        longitude: -89.6237
    }
];

// Helper to normalize strings for search (removes accents and special chars)
function slugify(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
        .normalize("NFD")               // Decompose accents
        .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}
