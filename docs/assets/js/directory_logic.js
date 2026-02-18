document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('directorySearch');
    const navbarSearch = document.getElementById('navbarSearch');
    const searchBtn = document.getElementById('searchBtn');
    const resultsContainer = document.getElementById('directoryResults');
    const categoryContainer = document.getElementById('categoryChips');
    const sidebarLocations = document.getElementById('sidebarLocations');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const body = document.body;

    // Helpers
    const escapeHtml = (unsafe) => {
        if (!unsafe) return "";
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

    // Modal elements
    const menuModalEl = document.getElementById('menuModal');
    const menuModal = new bootstrap.Modal(menuModalEl);
    const modalContent = document.getElementById('modalContent');

    let currentCity = 'tijuana'; // Default to Tijuana
    let currentCategory = '';
    let renderTimeout;
    let allDirectoryData = [];

    // Fetch data from Supabase + Local
    async function loadAllData() {
        allDirectoryData = await getBusinesses();
        initLocations();
        initCategories();
        renderDirectory('', currentCity);
    }

    // Sidebar Toggle Logic
    function toggleSidebar() {
        body.classList.toggle('sidebar-open');
        body.classList.toggle('sidebar-closed');
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

    // Initialize Locations in Sidebar
    function initLocations() {
        if (!sidebarLocations) return;

        const cities = ['Todas', ...new Set(allDirectoryData.map(item => item.city))];
        sidebarLocations.innerHTML = '';

        cities.forEach(city => {
            const citySlug = city === 'Todas' ? '' : slugify(city);
            const btn = document.createElement('button');
            btn.className = `nav-link-custom ${citySlug === currentCity ? 'active' : ''}`;
            btn.innerHTML = `<i class="bi bi-geo-alt"></i> <span>${city}</span>`;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-link-custom').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCity = citySlug;
                renderDirectory(searchInput.value, currentCity, currentCategory);

                if (window.innerWidth < 992 && body.classList.contains('sidebar-open')) {
                    toggleSidebar();
                }
            });
            sidebarLocations.appendChild(btn);
        });
    }

    // Initialize Categories
    function initCategories() {
        if (!categoryContainer) return;

        const categories = ['Todos', ...new Set(allDirectoryData.map(item => item.category))];
        categoryContainer.innerHTML = '';

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `chip ${cat === 'Todos' ? 'active' : ''}`;
            btn.textContent = cat;
            btn.setAttribute('data-category', cat === 'Todos' ? '' : cat);
            btn.addEventListener('click', () => {
                document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-category');
                renderDirectory(searchInput.value, currentCity, currentCategory);
            });
            categoryContainer.appendChild(btn);
        });
    }

    function renderDirectory(filterText = '', cityFilter = '', catFilter = '') {
        resultsContainer.classList.add('results-hidden');

        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
            resultsContainer.innerHTML = '';

            const filtered = allDirectoryData.filter(item => {
                const searchLower = filterText.toLowerCase();
                const matchesText = !filterText ||
                    item.name.toLowerCase().includes(searchLower) ||
                    item.city.toLowerCase().includes(searchLower) ||
                    (item.state && item.state.toLowerCase().includes(searchLower)) ||
                    (item.zip && item.zip.toString().includes(filterText)) ||
                    item.category.toLowerCase().includes(searchLower);

                const itemCitySlug = slugify(item.city);
                const matchesCity = !cityFilter || itemCitySlug === cityFilter;
                const matchesCategory = !catFilter || item.category === catFilter;

                return matchesText && matchesCity && matchesCategory;
            });

            if (filtered.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="col-12 text-center py-5 animate-fade-in">
                        <i class="bi bi-search display-1 text-muted opacity-25"></i>
                        <p class="lead mt-3 text-muted">No encontramos resultados para tu búsqueda.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach((item, index) => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';

                const delay = (index % 9) * 0.1;
                const isRestaurant = item.category === 'Restaurantes' || item.is_restaurant;

                // Sanitize values
                const sName = escapeHtml(item.name);
                const sCity = escapeHtml(item.city);
                const sCategory = escapeHtml(item.category);
                const sState = escapeHtml(item.state);
                const sAddress = escapeHtml(item.address);
                const sLogo = escapeHtml(item.logo);

                // New Card Design: Single Purple Button
                const buttonText = isRestaurant ? 'Ver Menú' : 'Ver Detalles';

                col.innerHTML = `
                    <div class="card h-100 restaurant-card border-0 shadow-sm overflow-hidden animate-fade-in" style="animation-delay: ${delay}s; cursor: pointer;">
                        <div class="card-img-wrapper position-relative" style="background: white; padding: 25px; height: 180px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(0,0,0,0.02);">
                            <img src="${sLogo}" alt="${sName}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                            <span class="badge position-absolute top-0 start-0 m-3" style="background: #7c83fd; color: white; border-radius: 10px; padding: 6px 12px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase;">${sCategory}</span>
                            <span class="badge bg-white text-dark position-absolute top-0 end-0 m-3 shadow-sm border-0" style="border-radius: 20px; padding: 8px 18px; font-size: 0.8rem; font-weight: 500;">${sCity}</span>
                        </div>
                        <div class="card-body d-flex flex-column p-4">
                            <div class="d-flex justify-content-between align-items-start mb-1">
                                <h4 class="fw-bold mb-0" style="color: #4338ca; font-size: 1.4rem;">${sName}</h4>
                            </div>
                            <p class="text-muted mb-4" style="font-size: 0.95rem;">
                                <i class="bi bi-geo-alt-fill me-1" style="color: #7c83fd;"></i>${sState} ${sAddress}
                            </p>

                            <div class="mt-auto">
                                <button class="btn btn-custom-primary w-100 rounded-pill py-3" style="background: #7c83fd !important; color: white; border: none;">
                                    <i class="bi bi-qr-code-scan me-2"></i>${buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                // Add click event to the whole card
                col.querySelector('.restaurant-card').addEventListener('click', (e) => {
                    // Prevent opening modal if clicking social icons
                    if (!e.target.closest('a') && !e.target.closest('.social-link-icon')) {
                        showBusinessDetails(item.id || item.name);
                    }
                });

                resultsContainer.appendChild(col);
            });

            resultsContainer.classList.remove('results-hidden');

            // Force library initialization
            forceLibraryInit();
        }, 300);
    }

    function forceLibraryInit() {
        const hasMenutech = window.MenutechUI && typeof window.MenutechUI.init === 'function';
        const hasGlf = typeof window.glfBindButtons === 'function';

        if (hasMenutech) window.MenutechUI.init();
        if (hasGlf) window.glfBindButtons();

        // Retry for dynamic/delayed rendering
        setTimeout(() => {
            if (hasMenutech) window.MenutechUI.init();
            if (hasGlf) window.glfBindButtons();
        }, 500);
    }

    window.showBusinessDetails = function(id) {
        const item = allDirectoryData.find(b => (b.id && b.id == id) || b.name == id);
        if (!item) return;

        const isRestaurant = item.category === 'Restaurantes' || item.is_restaurant;
        const sName = escapeHtml(item.name);
        const sLogo = escapeHtml(item.logo);
        const sCity = escapeHtml(item.city);
        const sCategory = escapeHtml(item.category);
        const sAddress = escapeHtml(item.address);
        const sState = escapeHtml(item.state);
        const sWebsite = escapeHtml(item.website || item.menuUrl);
        const btnBg = item.btn_bg_color || '#f1c40f';
        const btnText = item.btn_text_color || '#ffffff';

        // Social Media
        let socialHtml = '';
        if (item.social_media) {
            if (item.social_media.facebook) socialHtml += `<a href="${escapeHtml(item.social_media.facebook)}" target="_blank" class="social-link-icon me-2 text-primary fs-4"><i class="bi bi-facebook"></i></a>`;
            if (item.social_media.instagram) socialHtml += `<a href="${escapeHtml(item.social_media.instagram)}" target="_blank" class="social-link-icon me-2 text-danger fs-4"><i class="bi bi-instagram"></i></a>`;
            if (item.social_media.whatsapp) {
                const waNum = item.social_media.whatsapp.replace(/\D/g, '');
                socialHtml += `<a href="https://wa.me/${waNum}" target="_blank" class="social-link-icon text-success fs-4"><i class="bi bi-whatsapp"></i></a>`;
            }
        }

        // Action Buttons (Menutech & Gloria Food)
        let actionHtml = '';
        if (isRestaurant && item.cuid && item.ruid) {
            actionHtml = `
                <div class="menutech-container shadow-sm border-0 bg-light-subtle rounded-4 p-4 mt-4">
                    <h6 class="fw-bold mb-3 text-center opacity-75">
                        <i class="bi bi-lightning-charge-fill text-warning me-2"></i>Acciones Rápidas
                    </h6>
                    <div class="row g-3">
                        <div class="col-12">
                            <menutech-orders
                                cuid="${item.cuid}"
                                ruid="${item.ruid}"
                                background="${item.order_bg_color || '#f2a04a'}"
                                color="${item.order_text_color || '#ffffff'}"
                                textColor="${item.order_text_color || '#ffffff'}"
                                data-glf-cuid="${item.cuid}"
                                data-glf-ruid="${item.ruid}"
                            ></menutech-orders>
                        </div>
                        ${item.has_reservation ? `
                        <div class="col-12">
                            <menutech-reservations
                                cuid="${item.cuid}"
                                ruid="${item.ruid}"
                                background="${item.res_bg_color || '#2f4854'}"
                                color="${item.res_text_color || '#ffffff'}"
                                textColor="${item.res_text_color || '#ffffff'}"
                                data-glf-cuid="${item.cuid}"
                                data-glf-ruid="${item.ruid}"
                                data-glf-reservation="true"
                            ></menutech-reservations>
                        </div>` : ''}
                    </div>
                </div>
            `;
        } else if (item.order_url || item.reservation_url || sWebsite) {
            actionHtml = `
                <div class="menutech-container shadow-sm border-0 bg-light-subtle rounded-4 p-4 mt-4">
                     <h6 class="fw-bold mb-3 text-center opacity-75"><i class="bi bi-link-45deg me-2"></i>Enlaces Directos</h6>
                    <div class="d-grid gap-3">
                        ${item.order_url ? `<a href="${escapeHtml(item.order_url)}" target="_blank" class="btn fw-bold rounded-pill py-3 shadow-sm" style="background-color: ${btnBg}; color: ${btnText}; border: none;"><i class="bi bi-bag-check me-2"></i>Ordena Ahora</a>` : ''}
                        ${item.reservation_url ? `<a href="${escapeHtml(item.reservation_url)}" target="_blank" class="btn btn-info text-white fw-bold rounded-pill py-3 shadow-sm"><i class="bi bi-calendar-event me-2"></i>Reserva Mesa</a>` : ''}
                        ${sWebsite ? `<a href="${sWebsite}" target="_blank" class="btn btn-outline-primary fw-bold rounded-pill py-3"><i class="bi bi-globe me-2"></i>Ver Menú / Sitio Web</a>` : ''}
                    </div>
                </div>
            `;
        }

        modalContent.innerHTML = `
            <div class="business-card-header text-center p-4" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: relative; border-radius: 1.5rem 1.5rem 0 0;">
                <button type="button" class="btn-close position-absolute top-0 end-0 m-4 shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                <img src="${sLogo}" alt="${sName}" class="business-logo-lg mb-3" style="max-height: 120px; max-width: 100%; object-fit: contain;">
                <h2 class="fw-bold mb-1" style="color: #1e293b;">${sName}</h2>
                <div class="badge bg-primary px-3 py-2 mb-3 rounded-pill">${sCategory}</div>
                <div class="d-flex justify-content-center">
                    ${socialHtml}
                </div>
            </div>
            <div class="modal-body p-4 p-md-5">
                <div class="row g-4">
                    <div class="col-md-6">
                        <h5 class="fw-bold mb-3"><i class="bi bi-info-circle me-2 text-primary"></i>Información</h5>
                        <ul class="list-unstyled">
                            <li class="mb-3 d-flex">
                                <i class="bi bi-geo-alt-fill text-danger me-3 fs-5"></i>
                                <div>
                                    <div class="fw-bold">Ubicación</div>
                                    <div class="text-muted">${sAddress}, ${sCity}, ${sState}</div>
                                </div>
                            </li>
                            ${item.hours ? `
                            <li class="mb-3 d-flex">
                                <i class="bi bi-clock-fill text-success me-3 fs-5"></i>
                                <div>
                                    <div class="fw-bold">Horarios</div>
                                    <div class="text-muted small">Consulta disponibilidad al ordenar</div>
                                </div>
                            </li>` : ''}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        ${actionHtml}
                    </div>
                </div>

                ${sWebsite && !item.cuid ? `
                <div class="mt-4 pt-4 border-top">
                    <h5 class="fw-bold mb-3"><i class="bi bi-eye me-2 text-primary"></i>Vista Previa</h5>
                    <div class="ratio ratio-16x9 rounded-4 overflow-hidden shadow-sm">
                        <iframe src="${sWebsite}" frameborder="0"></iframe>
                    </div>
                </div>` : ''}
            </div>
        `;

        menuModal.show();
        forceLibraryInit();
    };

    const handleSearch = (val) => {
        if (searchInput) searchInput.value = val;
        if (navbarSearch) navbarSearch.value = val;
        renderDirectory(val, currentCity, currentCategory);
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            handleSearch(searchInput.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch(searchInput.value);
            else if (searchInput.value.length > 2 || searchInput.value.length === 0) {
                handleSearch(searchInput.value);
            }
        });
    }

    if (navbarSearch) {
        navbarSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch(navbarSearch.value);
            else if (navbarSearch.value.length > 2 || navbarSearch.value.length === 0) {
                handleSearch(navbarSearch.value);
            }
        });
    }

    if (window.innerWidth < 992) {
        body.classList.remove('sidebar-open');
        body.classList.add('sidebar-closed');
    }

    loadAllData();
});
