const directoryData = [
    {
        name: "El Herradero",
        city: "CDMX",
        state: "Polanco",
        zip: "11560",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=El+Herradero",
        menuUrl: "https://tragalero.com/menu/el-herradero"
    },
    {
        name: "Alex's Tacos",
        city: "Tijuana",
        state: "Zona Río",
        zip: "22010",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Alexs+Tacos",
        menuUrl: "https://tragalero.com/menu/alexs-tacos"
    },
    {
        name: "Mantenimiento Express",
        city: "CDMX",
        state: "Condesa",
        zip: "06140",
        category: "Hogar",
        logo: "https://via.placeholder.com/150?text=Mantenimiento",
        menuUrl: "https://tragalero.com/servicios/mantenimiento"
    },
    {
        name: "Constructora del Norte",
        city: "Monterrey",
        state: "San Pedro",
        zip: "66220",
        category: "Construcción",
        logo: "https://via.placeholder.com/150?text=Construccion",
        menuUrl: "https://tragalero.com/servicios/construccion"
    },
    {
        name: "TechFix Soluciones",
        city: "Guadalajara",
        state: "Zapopan",
        zip: "45010",
        category: "Servicios Técnicos",
        logo: "https://via.placeholder.com/150?text=TechFix",
        menuUrl: "https://tragalero.com/servicios/techfix"
    },
    {
        name: "Sushi Roll",
        city: "Guadalajara",
        state: "Zapopan",
        zip: "45010",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Sushi+Roll",
        menuUrl: "https://tragalero.com/menu/sushi-roll"
    },
    {
        name: "Pinturas Perfectas",
        city: "Puebla",
        state: "Centro",
        zip: "72000",
        category: "Hogar",
        logo: "https://via.placeholder.com/150?text=Pinturas",
        menuUrl: "https://tragalero.com/servicios/pinturas"
    },
    {
        name: "Electrónica Galván",
        city: "Tijuana",
        state: "Centro",
        zip: "22000",
        category: "Servicios Técnicos",
        logo: "https://via.placeholder.com/150?text=Electronica",
        menuUrl: "https://tragalero.com/servicios/galvan"
    },
    {
        name: "La Pizzería",
        city: "Monterrey",
        state: "San Pedro",
        zip: "66220",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=La+Pizzeria",
        menuUrl: "https://tragalero.com/menu/la-pizzeria"
    },
    {
        name: "Hacienda Teya",
        city: "Mérida",
        state: "Yucatán",
        zip: "97000",
        category: "Restaurantes",
        logo: "https://via.placeholder.com/150?text=Hacienda+Teya",
        menuUrl: "https://tragalero.com/menu/hacienda-teya"
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
