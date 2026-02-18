// Supabase shared configuration and logic
const SUPABASE_URL = 'https://cnoiesjjupubkrgyhbof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub2llc2pqdXB1YmtyZ3loYm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjYxMjIsImV4cCI6MjA4NjIwMjEyMn0.GZ3gGs7Wk4IJm0Ebp-3bAUlFtKHPV6jTpLATacLcJhA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches businesses from Supabase and merges them with local data.
 */
async function getBusinesses(showAll = false) {
    let dynamicData = [];
    try {
        let query = supabaseClient.from('businesses').select('*');

        if (!showAll) {
            query = query.eq('is_visible', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
            dynamicData = data.map(item => ({
                id: item.id,
                name: item.name,
                city: item.city,
                state: item.state || '',
                zip: item.zip || '',
                category: item.category || 'Varios',
                logo: item.logo_url || 'https://via.placeholder.com/150?text=Logo',
                menuUrl: item.website || '',
                website: item.website || '',
                btn_bg_color: item.btn_bg_color || '',
                btn_text_color: item.btn_text_color || '',
                address: item.address_detail || '',
                social_media: item.social_media || {},
                hours: item.hours || {},
                is_restaurant: item.is_restaurant,
                cuid: item.cuid,
                ruid: item.ruid,
                order_bg_color: item.order_bg_color,
                order_text_color: item.order_text_color,
                res_bg_color: item.res_bg_color,
                res_text_color: item.res_text_color,
                has_reservation: item.has_reservation,
                order_url: item.order_url,
                reservation_url: item.reservation_url,
                is_visible: item.is_visible,
                owner_id: item.owner_id
            }));
        }
    } catch (e) {
        console.error("Error fetching from Supabase businesses:", e);
    }

    // Merge with local directoryData (from directory_data.js)
    // Local data serves as fallback or static content
    const merged = [...dynamicData, ...directoryData];
    return showAll ? merged : merged.filter(b => b.is_visible !== false);
}

/**
 * Auth check helpers
 */
function getLoggedInUser() {
    const session = sessionStorage.getItem('tragalero_user');
    return session ? JSON.parse(session) : null;
}

/**
 * Basic HTML escaping to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    sessionStorage.removeItem('tragalero_user');
    window.location.href = './login.html';
}

function checkAccess(roleRequired) {
    const user = getLoggedInUser();
    if (!user) {
        window.location.href = './login.html';
        return null;
    }
    if (roleRequired && user.role !== roleRequired && user.role !== 'Admin') {
        window.location.href = './restaurantapp.html';
        return null;
    }
    return user;
}

/**
 * Renders the unified circular user menu
 * Expects a container with id "userMenuContainer" or similar
 */
function renderUserMenu(containerId = 'authButtons') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const user = getLoggedInUser();

    if (!user) {
        container.innerHTML = `
            <div class="user-menu-wrapper">
                <button class="user-avatar-btn shadow-sm" style="background: rgba(0,0,0,0.05); color: var(--bs-body-color);" id="userMenuBtn">
                    <i class="bi bi-person"></i>
                </button>
                <div class="user-dropdown-menu" id="userDropdown">
                    <div class="user-info-header text-center">
                        <div class="fw-bold text-muted">Invitado</div>
                        <div class="small text-muted">No has iniciado sesión</div>
                    </div>
                    <a href="./login.html" class="user-dropdown-item">
                        <i class="bi bi-box-arrow-in-right"></i>Iniciar Sesión
                    </a>
                    <a href="./restaurantapp.html" class="user-dropdown-item">
                        <i class="bi bi-search"></i>Explorar Directorio
                    </a>
                </div>
            </div>
        `;
    } else {

        container.innerHTML = `
            <div class="user-menu-wrapper">
                <button class="user-avatar-btn shadow-sm" id="userMenuBtn">
                    <i class="bi bi-person-fill"></i>
                </button>
                <div class="user-dropdown-menu" id="userDropdown">
                    <div class="user-info-header text-center">
                        <div class="fw-bold text-primary">${user.name}</div>
                        <div class="small text-muted">${user.role}</div>
                    </div>
                    <a href="./admin.html" class="user-dropdown-item">
                        <i class="bi bi-grid-fill"></i>Mi Panel
                    </a>
                    <a href="./directorymap.html" class="user-dropdown-item">
                        <i class="bi bi-plus-circle"></i>Nuevo Negocio
                    </a>
                    ${user.role === 'Admin' ? `
                        <a href="./users.html" class="user-dropdown-item">
                            <i class="bi bi-people-fill"></i>Usuarios
                        </a>
                    ` : ''}
                    <hr class="my-2 opacity-10">
                    <a href="#" onclick="logout(); return false;" class="user-dropdown-item logout">
                        <i class="bi bi-box-arrow-right"></i>Cerrar Sesión
                    </a>
                </div>
            </div>
        `;
    }

    const btn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');

    if (btn && dropdown) {
        btn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        };

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.classList.remove('show');
            }
        });
    }
}
