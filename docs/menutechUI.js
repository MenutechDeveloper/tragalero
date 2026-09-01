/**
 * Menutech / Tragalero Digital Menu Web Component
 * Standardized Menutech UI for platform digital menus with Supabase real-time integration.
 */

(function () {
    const SUPABASE_URL = 'https://jqmmzufomzcsyzdskxze.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbW16dWZvbXpjc3l6ZHNreHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDE1NTgsImV4cCI6MjA4ODMxNzU1OH0.mAd28JHZmLZGLd4Z3r59SgtSdeEpMyZd_WJdrD381Vs';

    async function supabaseFetch(table, queryParams = '') {
        try {
            const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams}`;
            const res = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error('Supabase fetch error:', e);
            return null;
        }
    }

    async function supabasePost(table, payload) {
        try {
            const url = `${SUPABASE_URL}/rest/v1/${table}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText);
            }
            return await res.json();
        } catch (e) {
            console.error('Supabase post error:', e);
            throw e;
        }
    }

    class MenutechPlatformOrders extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.cart = [];
            this.menuData = null;
            this.businessData = null;
            this.activeCategory = null;
            this.selectedDish = null;
            this.modalState = null; // 'dish', 'cart', 'info', 'success'
            this.lastOrderRef = null;
            this.lastOrderStatus = 'pending';
            this.supabaseClient = null;
            this.orderChannel = null;
        }

        async initSupabaseClient() {
            if (this.supabaseClient) return this.supabaseClient;
            try {
                if (window.supabase && window.supabase.createClient) {
                    this.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                } else {
                    const { createClient } = await import("https://esm.sh/@supabase/supabase-js");
                    this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                }
            } catch (err) {
                console.error("Supabase client init error in MenutechPlatformOrders:", err);
            }
            return this.supabaseClient;
        }

        static get observedAttributes() {
            return ['restaurant', 'slug', 'domain', 'cuid', 'ruid'];
        }

        attributeChangedCallback() {
            this.loadAndRender();
        }

        connectedCallback() {
            this.loadAndRender();
        }

        async loadAndRender() {
            const params = new URLSearchParams(window.location.search);
            let slug = this.getAttribute('slug') || this.getAttribute('restaurant') || params.get('n') || params.get('slug') || '';
            let domain = this.getAttribute('domain') || params.get('domain') || '';

            if (slug) {
                slug = slug.trim().toLowerCase();
            }
            if (domain) {
                domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
            }

            let menuRecord = null;
            if (slug) {
                const res = await supabaseFetch('tragalero_menus', `slug=ilike.${encodeURIComponent(slug)}`);
                if (res && res.length > 0) {
                    menuRecord = res[0];
                } else {
                    const fallback = await supabaseFetch('menutech_menus', `slug=ilike.${encodeURIComponent(slug)}`);
                    if (fallback && fallback.length > 0) menuRecord = fallback[0];
                }
            } else if (domain) {
                const res = await supabaseFetch('tragalero_menus', `domain=ilike.${encodeURIComponent(domain)}`);
                if (res && res.length > 0) {
                    menuRecord = res[0];
                } else {
                    const fallback = await supabaseFetch('menutech_menus', `domain=ilike.${encodeURIComponent(domain)}`);
                    if (fallback && fallback.length > 0) menuRecord = fallback[0];
                }
            } else {
                // Default fallback: load first menu from tragalero_menus or menutech_menus
                const res = await supabaseFetch('tragalero_menus', 'limit=1');
                if (res && res.length > 0) {
                    menuRecord = res[0];
                } else {
                    const fallback = await supabaseFetch('menutech_menus', 'limit=1');
                    if (fallback && fallback.length > 0) menuRecord = fallback[0];
                }
            }

            this.menuRecord = menuRecord;
            this.menuData = menuRecord ? (menuRecord.config || {}) : null;

            if (menuRecord && menuRecord.user_id) {
                const bRes = await supabaseFetch('businesses', `owner_id=eq.${menuRecord.user_id}`);
                if (bRes && bRes.length > 0) {
                    this.businessData = bRes[0];
                }
            }

            this.render();
        }

        getCartCount() {
            return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }

        getCartTotal() {
            return this.cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        }

        addToCart(dish, size = null, toppings = [], quantity = 1, notes = '') {
            const unitPrice = size ? parseFloat(size.price || 0) : parseFloat(dish.price || 0);
            const toppingsPrice = toppings.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
            const totalPrice = unitPrice + toppingsPrice;

            const cartItem = {
                id: Date.now() + Math.random().toString(36).substring(2, 5),
                dishName: dish.name,
                sizeName: size ? size.name : '',
                toppings: toppings.map(t => t.name),
                price: totalPrice,
                quantity: quantity,
                notes: notes
            };

            this.cart.push(cartItem);
            this.modalState = null;
            this.render();
        }

        updateCartQuantity(index, delta) {
            if (!this.cart[index]) return;
            this.cart[index].quantity += delta;
            if (this.cart[index].quantity <= 0) {
                this.cart.splice(index, 1);
            }
            this.render();
        }

        async submitOrder(formData) {
            if (this.cart.length === 0) return;

            const orderPayload = {
                user_id: this.menuRecord ? this.menuRecord.user_id : null,
                customer_name: formData.name,
                customer_phone: formData.phone,
                address: formData.address,
                items: this.cart,
                total_amount: this.getCartTotal(),
                status: 'pending',
                customer_notes: formData.notes || ''
            };

            try {
                let res = null;
                let targetTable = 'tragalero_orders';
                try {
                    res = await supabasePost('tragalero_orders', orderPayload);
                } catch (e1) {
                    targetTable = 'menutech_orders';
                    res = await supabasePost('menutech_orders', orderPayload);
                }

                const inserted = res && res[0] ? res[0] : null;
                this.lastOrderRef = inserted ? inserted.id : Date.now();
                this.lastOrderStatus = 'pending';
                this.cart = [];
                this.modalState = 'success';
                this.render();

                if (inserted && inserted.id) {
                    this.subscribeToRealtimeOrder(targetTable, inserted.id);
                }
            } catch (err) {
                alert('Error al enviar la orden: ' + err.message);
            }
        }

        async subscribeToRealtimeOrder(table, orderId) {
            const client = await this.initSupabaseClient();
            if (!client) return;

            if (this.orderChannel) {
                client.removeChannel(this.orderChannel);
            }

            this.orderChannel = client.channel(`order_status_${orderId}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: table,
                    filter: `id=eq.${orderId}`
                }, (payload) => {
                    if (payload.new && payload.new.status) {
                        this.lastOrderStatus = payload.new.status;
                        if (this.modalState === 'success') {
                            this.render();
                        }
                    }
                })
                .subscribe();
        }

        render() {
            const businessName = (this.businessData && this.businessData.name) ? this.businessData.name : (this.menuRecord && this.menuRecord.slug ? this.menuRecord.slug.toUpperCase() : 'MENUTECH');
            const coverUrl = (this.menuRecord && this.menuRecord.cover_url) ? this.menuRecord.cover_url : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80';
            const categories = (this.menuData && this.menuData.categories) ? this.menuData.categories : [];
            const cartCount = this.getCartCount();

            this.shadowRoot.innerHTML = `
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
                <style>
                    :host {
                        display: block;
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        color: #1a1a1a;
                        background-color: #f4f4f6;
                        min-height: 100vh;
                        padding: 20px 10px;
                        box-sizing: border-box;
                    }

                    *, *::before, *::after {
                        box-sizing: border-box;
                    }

                    .menu-wrapper {
                        max-width: 800px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                        overflow: hidden;
                        position: relative;
                    }

                    /* Header Bar */
                    .menu-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 18px 24px;
                        background: #ffffff;
                        border-bottom: 1px solid #f0f0f4;
                    }

                    .brand-title {
                        font-size: 1.35rem;
                        font-weight: 900;
                        letter-spacing: -0.5px;
                        text-transform: uppercase;
                        color: #111111;
                    }

                    .header-actions {
                        display: flex;
                        align-items: center;
                        background: #f0f0f2;
                        padding: 4px;
                        border-radius: 12px;
                        gap: 4px;
                    }

                    .header-btn {
                        background: transparent;
                        border: none;
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        position: relative;
                        color: #333333;
                        font-size: 1.1rem;
                        transition: background 0.2s;
                    }

                    .header-btn:hover {
                        background: #e2e2e8;
                    }

                    .header-badge {
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        background: #ff8a00;
                        color: #ffffff;
                        font-size: 0.68rem;
                        font-weight: 800;
                        width: 17px;
                        height: 17px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    /* Header Banner Image */
                    .cover-banner-container {
                        width: 100%;
                        max-height: 250px;
                        overflow: hidden;
                        background: #eef;
                    }

                    .cover-banner {
                        width: 100%;
                        height: 250px;
                        object-fit: cover;
                        display: block;
                    }

                    /* Menu Body */
                    .menu-body {
                        padding: 24px 28px;
                    }

                    .category-section {
                        margin-bottom: 32px;
                    }

                    .category-title {
                        font-size: 1.5rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        color: #111111;
                        margin: 0 0 16px 0;
                        letter-spacing: -0.5px;
                    }

                    .dishes-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 16px;
                    }

                    @media (max-width: 650px) {
                        .dishes-grid {
                            grid-template-columns: 1fr;
                        }
                        .menu-body {
                            padding: 16px;
                        }
                        .menu-header {
                            padding: 14px 18px;
                        }
                    }

                    /* Dish Item Card */
                    .dish-card {
                        display: flex;
                        gap: 12px;
                        padding: 12px;
                        border-radius: 12px;
                        background: #ffffff;
                        border: 1px solid #f0f0f4;
                        cursor: pointer;
                        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
                    }

                    .dish-card:hover {
                        transform: translateY(-2px);
                        border-color: #e0e0e6;
                        box-shadow: 0 6px 16px rgba(0,0,0,0.04);
                    }

                    .dish-img {
                        width: 72px;
                        height: 72px;
                        border-radius: 10px;
                        object-fit: cover;
                        flex-shrink: 0;
                        background: #f4f4f6;
                    }

                    .dish-info {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                    }

                    .dish-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 6px;
                    }

                    .dish-name {
                        font-size: 0.92rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        color: #111111;
                        line-height: 1.25;
                        margin: 0;
                    }

                    .dish-price {
                        font-size: 0.95rem;
                        font-weight: 800;
                        color: #111111;
                        white-space: nowrap;
                    }

                    .dish-desc {
                        font-size: 0.8rem;
                        color: #777777;
                        margin-top: 4px;
                        line-height: 1.35;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    /* Floating Cart Button */
                    .floating-cart-btn {
                        position: fixed;
                        bottom: 24px;
                        right: 24px;
                        width: 58px;
                        height: 58px;
                        border-radius: 50%;
                        background: #ff8a00;
                        color: #ffffff;
                        border: none;
                        box-shadow: 0 8px 24px rgba(255, 138, 0, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        cursor: pointer;
                        z-index: 999;
                        transition: transform 0.2s, background 0.2s;
                    }

                    .floating-cart-btn:hover {
                        transform: scale(1.05);
                        background: #e67c00;
                    }

                    .floating-cart-badge {
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        background: #111111;
                        color: #ffffff;
                        font-size: 0.72rem;
                        font-weight: 800;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid #ffffff;
                    }

                    /* Modals Overlay */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 16px;
                        backdrop-filter: blur(3px);
                    }

                    .modal-card {
                        background: #ffffff;
                        border-radius: 20px;
                        width: 100%;
                        max-width: 480px;
                        max-height: 90vh;
                        overflow-y: auto;
                        padding: 24px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                        position: relative;
                        animation: popIn 0.2s ease-out;
                    }

                    @keyframes popIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }

                    .modal-close {
                        position: absolute;
                        top: 18px;
                        right: 18px;
                        background: #f0f0f4;
                        border: none;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 1rem;
                        color: #555;
                    }

                    .modal-title {
                        font-size: 1.25rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        margin-top: 0;
                        margin-bottom: 16px;
                        color: #111;
                    }

                    /* Form Inputs */
                    .form-group {
                        margin-bottom: 14px;
                    }

                    .form-group label {
                        display: block;
                        font-size: 0.85rem;
                        font-weight: 700;
                        margin-bottom: 6px;
                        color: #333;
                    }

                    .form-control {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        font-family: inherit;
                        font-size: 0.9rem;
                    }

                    .form-control:focus {
                        outline: none;
                        border-color: #ff8a00;
                    }

                    .btn-submit {
                        width: 100%;
                        padding: 14px;
                        background: #ff8a00;
                        color: #ffffff;
                        border: none;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 1rem;
                        text-transform: uppercase;
                        cursor: pointer;
                        transition: background 0.2s;
                        margin-top: 12px;
                    }

                    .btn-submit:hover {
                        background: #e67c00;
                    }

                    /* Cart List */
                    .cart-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }

                    .qty-controls {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .qty-btn {
                        width: 26px;
                        height: 26px;
                        border-radius: 6px;
                        border: 1px solid #ccc;
                        background: #f9f9f9;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-weight: 800;
                    }
                </style>

                <div class="menu-wrapper">
                    <header class="menu-header">
                        <div class="brand-title">${businessName}</div>
                        <div class="header-actions">
                            <button class="header-btn" id="btn-layout" title="Vista"><i class="bi bi-journal-text"></i></button>
                            <button class="header-btn" id="btn-info" title="Información"><i class="bi bi-clock"></i></button>
                            <button class="header-btn" id="btn-cart-top" title="Carrito">
                                <i class="bi bi-cart3"></i>
                                ${cartCount > 0 ? `<span class="header-badge">${cartCount}</span>` : ''}
                            </button>
                        </div>
                    </header>

                    <div class="cover-banner-container">
                        <img class="cover-banner" src="${coverUrl}" alt="Banner">
                    </div>

                    <main class="menu-body">
                        ${categories.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #888;">
                                <i class="bi bi-journal-x" style="font-size: 2rem;"></i>
                                <p style="margin-top: 10px;">No hay productos configurados en este menú.</p>
                            </div>
                        ` : categories.map((cat, catIdx) => `
                            <section class="category-section">
                                <h2 class="category-title">${cat.name || 'CATEGORÍA'}</h2>
                                <div class="dishes-grid">
                                    ${(cat.dishes || []).map((dish, dishIdx) => `
                                        <div class="dish-card" data-cat="${catIdx}" data-dish="${dishIdx}">
                                            ${dish.image ? `<img class="dish-img" src="${dish.image}" alt="${dish.name}">` : ''}
                                            <div class="dish-info">
                                                <div class="dish-header">
                                                    <h3 class="dish-name">${dish.name || 'Producto'}</h3>
                                                    <span class="dish-price">$${dish.price || 0}</span>
                                                </div>
                                                ${dish.description ? `<p class="dish-desc">${dish.description}</p>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>
                        `).join('')}
                    </main>
                </div>

                <!-- Floating Cart Button -->
                <button class="floating-cart-btn" id="btn-floating-cart">
                    <i class="bi bi-cart-fill"></i>
                    ${cartCount > 0 ? `<span class="floating-cart-badge">${cartCount}</span>` : ''}
                </button>

                <!-- Modals Container -->
                ${this.renderModalContent()}
            `;

            this.bindEvents();
        }

        renderModalContent() {
            if (!this.modalState) return '';

            if (this.modalState === 'info') {
                const address = (this.businessData && this.businessData.address_detail) || 'Dirección no especificada';
                const city = (this.businessData && this.businessData.city) || '';
                return `
                    <div class="modal-overlay" id="modal-backdrop">
                        <div class="modal-card">
                            <button class="modal-close" id="modal-close"><i class="bi bi-x-lg"></i></button>
                            <h3 class="modal-title">Horarios e Información</h3>
                            <p style="margin-bottom: 12px; color: #555;"><i class="bi bi-geo-alt-fill" style="color: #ff8a00;"></i> <strong>Ubicación:</strong> ${address} ${city}</p>
                            <p style="margin-bottom: 12px; color: #555;"><i class="bi bi-clock-fill" style="color: #ff8a00;"></i> <strong>Horario:</strong> Lunes a Domingo - 08:00 AM a 10:00 PM</p>
                        </div>
                    </div>
                `;
            }

            if (this.modalState === 'dish' && this.selectedDish) {
                const dish = this.selectedDish;
                const hasSizes = dish.sizes && dish.sizes.length > 0;
                return `
                    <div class="modal-overlay" id="modal-backdrop">
                        <div class="modal-card">
                            <button class="modal-close" id="modal-close"><i class="bi bi-x-lg"></i></button>
                            ${dish.image ? `<img src="${dish.image}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 14px;">` : ''}
                            <h3 class="modal-title">${dish.name}</h3>
                            <p style="color: #666; font-size: 0.88rem; margin-bottom: 14px;">${dish.description || ''}</p>

                            ${hasSizes ? `
                                <div class="form-group">
                                    <label>Tamaño / Opción:</label>
                                    <select class="form-control" id="select-size">
                                        ${dish.sizes.map((s, idx) => `<option value="${idx}">${s.name} - $${s.price}</option>`).join('')}
                                    </select>
                                </div>
                            ` : `<p style="font-weight: 800; font-size: 1.1rem; color: #111; margin-bottom: 14px;">Precio: $${dish.price || 0}</p>`}

                            <div class="form-group">
                                <label>Instrucciones Especiales:</label>
                                <input type="text" class="form-control" id="input-notes" placeholder="Ej: Sin cebolla, extra salsa...">
                            </div>

                            <button class="btn-submit" id="btn-add-dish"><i class="bi bi-cart-plus"></i> Agregar al Carrito</button>
                        </div>
                    </div>
                `;
            }

            if (this.modalState === 'cart') {
                const total = this.getCartTotal();
                return `
                    <div class="modal-overlay" id="modal-backdrop">
                        <div class="modal-card">
                            <button class="modal-close" id="modal-close"><i class="bi bi-x-lg"></i></button>
                            <h3 class="modal-title">Tu Carrito (${this.getCartCount()})</h3>

                            ${this.cart.length === 0 ? `
                                <p style="text-align: center; color: #888; margin: 30px 0;">Tu carrito está vacío.</p>
                            ` : `
                                <div style="margin-bottom: 16px;">
                                    ${this.cart.map((item, idx) => `
                                        <div class="cart-item">
                                            <div>
                                                <div style="font-weight: 800; font-size: 0.92rem;">${item.dishName} ${item.sizeName ? `(${item.sizeName})` : ''}</div>
                                                <div style="font-size: 0.8rem; color: #777;">$${item.price} c/u</div>
                                                ${item.notes ? `<div style="font-size: 0.75rem; color: #888; font-style: italic;">Note: ${item.notes}</div>` : ''}
                                            </div>
                                            <div class="qty-controls">
                                                <button class="qty-btn" data-cart-idx="${idx}" data-delta="-1">-</button>
                                                <span style="font-weight: 800; font-size: 0.9rem;">${item.quantity}</span>
                                                <button class="qty-btn" data-cart-idx="${idx}" data-delta="1">+</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 1.1rem; padding: 10px 0; border-top: 2px dashed #eee;">
                                    <span>TOTAL:</span>
                                    <span>$${total.toFixed(2)}</span>
                                </div>

                                <hr style="border: 0; border-top: 1px solid #f0f0f4; margin: 16px 0;">
                                <h4 style="font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">Datos de Entrega</h4>

                                <form id="order-form">
                                    <div class="form-group">
                                        <label>Tu Nombre *</label>
                                        <input type="text" class="form-control" id="order-name" required placeholder="Ej: Juan Pérez">
                                    </div>
                                    <div class="form-group">
                                        <label>Teléfono / WhatsApp *</label>
                                        <input type="tel" class="form-control" id="order-phone" required placeholder="Ej: 55 1234 5678">
                                    </div>
                                    <div class="form-group">
                                        <label>Dirección de Entrega *</label>
                                        <input type="text" class="form-control" id="order-address" required placeholder="Calle, número, colonia...">
                                    </div>
                                    <div class="form-group">
                                        <label>Notas para el restaurante</label>
                                        <input type="text" class="form-control" id="order-notes" placeholder="Piso, timbre, etc.">
                                    </div>
                                    <button type="submit" class="btn-submit"><i class="bi bi-send-fill"></i> Confirmar Pedido</button>
                                </form>
                            `}
                        </div>
                    </div>
                `;
            }

            if (this.modalState === 'success') {
                let statusBadge = '<span style="background: #ff8a00; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Pendiente</span>';
                if (this.lastOrderStatus === 'accepted') {
                    statusBadge = '<span style="background: #2eb85c; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Aceptada</span>';
                } else if (this.lastOrderStatus === 'preparing') {
                    statusBadge = '<span style="background: #17a2b8; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">En Preparación</span>';
                } else if (this.lastOrderStatus === 'finished' || this.lastOrderStatus === 'ready') {
                    statusBadge = '<span style="background: #28a745; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Lista</span>';
                } else if (this.lastOrderStatus === 'delivered') {
                    statusBadge = '<span style="background: #6c757d; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Entregada</span>';
                } else if (this.lastOrderStatus === 'rejected') {
                    statusBadge = '<span style="background: #dc3545; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; text-transform: uppercase;">Rechazada</span>';
                }

                return `
                    <div class="modal-overlay" id="modal-backdrop">
                        <div class="modal-card" style="text-align: center;">
                            <button class="modal-close" id="modal-close"><i class="bi bi-x-lg"></i></button>
                            <i class="bi bi-check-circle-fill" style="font-size: 3.5rem; color: #2eb85c; display: block; margin-bottom: 12px;"></i>
                            <h3 class="modal-title" style="margin-bottom: 8px;">¡Pedido Recibido!</h3>
                            <div style="margin-bottom: 14px;">Estado en tiempo real: ${statusBadge}</div>
                            <p style="color: #555; font-size: 0.9rem; margin-bottom: 20px;">Tu orden #${this.lastOrderRef || ''} ha sido registrada con éxito. El restaurante actualizará el estado de tu pedido.</p>
                            <button class="btn-submit" id="btn-done">Aceptar</button>
                        </div>
                    </div>
                `;
            }

            return '';
        }

        bindEvents() {
            const sr = this.shadowRoot;

            // Header actions
            const btnInfo = sr.getElementById('btn-info');
            if (btnInfo) btnInfo.onclick = () => { this.modalState = 'info'; this.render(); };

            const btnCartTop = sr.getElementById('btn-cart-top');
            if (btnCartTop) btnCartTop.onclick = () => { this.modalState = 'cart'; this.render(); };

            const btnFloatingCart = sr.getElementById('btn-floating-cart');
            if (btnFloatingCart) btnFloatingCart.onclick = () => { this.modalState = 'cart'; this.render(); };

            // Dish Cards Click
            sr.querySelectorAll('.dish-card').forEach(card => {
                card.onclick = () => {
                    const cIdx = parseInt(card.getAttribute('data-cat'));
                    const dIdx = parseInt(card.getAttribute('data-dish'));
                    if (this.menuData && this.menuData.categories && this.menuData.categories[cIdx]) {
                        this.selectedDish = this.menuData.categories[cIdx].dishes[dIdx];
                        this.modalState = 'dish';
                        this.render();
                    }
                };
            });

            // Close Modal
            const modalClose = sr.getElementById('modal-close');
            if (modalClose) modalClose.onclick = () => { this.modalState = null; this.render(); };

            const modalBackdrop = sr.getElementById('modal-backdrop');
            if (modalBackdrop) {
                modalBackdrop.onclick = (e) => {
                    if (e.target === modalBackdrop) {
                        this.modalState = null;
                        this.render();
                    }
                };
            }

            // Add Dish to Cart Action
            const btnAddDish = sr.getElementById('btn-add-dish');
            if (btnAddDish && this.selectedDish) {
                btnAddDish.onclick = () => {
                    const selectSize = sr.getElementById('select-size');
                    const inputNotes = sr.getElementById('input-notes');
                    let sizeObj = null;
                    if (selectSize && this.selectedDish.sizes && this.selectedDish.sizes[selectSize.value]) {
                        sizeObj = this.selectedDish.sizes[selectSize.value];
                    }
                    const notesVal = inputNotes ? inputNotes.value : '';
                    this.addToCart(this.selectedDish, sizeObj, [], 1, notesVal);
                };
            }

            // Cart Quantity Buttons
            sr.querySelectorAll('.qty-btn').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.getAttribute('data-cart-idx'));
                    const delta = parseInt(btn.getAttribute('data-delta'));
                    this.updateCartQuantity(idx, delta);
                };
            });

            // Order Form Submit
            const orderForm = sr.getElementById('order-form');
            if (orderForm) {
                orderForm.onsubmit = (e) => {
                    e.preventDefault();
                    const name = sr.getElementById('order-name').value;
                    const phone = sr.getElementById('order-phone').value;
                    const address = sr.getElementById('order-address').value;
                    const notes = sr.getElementById('order-notes').value;
                    this.submitOrder({ name, phone, address, notes });
                };
            }

            // Done Button
            const btnDone = sr.getElementById('btn-done');
            if (btnDone) {
                btnDone.onclick = () => {
                    this.modalState = null;
                    this.render();
                };
            }
        }
    }

    if (!customElements.get('menutech-platform-orders')) {
        customElements.define('menutech-platform-orders', MenutechPlatformOrders);
    }
    if (!customElements.get('tragalero-platform-orders')) {
        customElements.define('tragalero-platform-orders', MenutechPlatformOrders);
    }

    window.MenutechPlatformOrders = MenutechPlatformOrders;
})();
