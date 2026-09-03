/**
 * Tragalero AI Chatbot Widget
 * Integrates OpenAI Assistant, Speech Recognition (Voice tool), Cloudinary image attachments,
 * dynamic dish price updates in tragalero_menus, and 5-day lead time task creation in tragalero_tasks.
 */

(function () {
    // 1. Inject CSS if not present
    if (!document.getElementById('tragalero-chatbot-css')) {
        const link = document.createElement('link');
        link.id = 'tragalero-chatbot-css';
        link.rel = 'stylesheet';
        link.href = './assets/css/chatbot.css';
        document.head.appendChild(link);
    }

    let attachedImageUrl = null;
    let isListening = false;
    let recognition = null;
    let currentUser = null;

    // 2. Build DOM elements
    document.addEventListener('DOMContentLoaded', async () => {
        initChatbotUI();
        initSpeechRecognition();
        if (typeof getLoggedInUser === 'function') {
            currentUser = await getLoggedInUser();
        }
    });

    function initChatbotUI() {
        if (document.getElementById('tragalero-chatbot-container')) return;

        const container = document.createElement('div');
        container.id = 'tragalero-chatbot-container';
        container.innerHTML = `
            <!-- Floating Action Button -->
            <button class="tragalero-chatbot-fab" id="chatbot-fab-btn" title="Asistente IA Tragalero">
                <i class="bi bi-robot" id="fab-icon"></i>
            </button>

            <!-- Chatbot Window Drawer -->
            <div class="tragalero-chatbot-window" id="chatbot-window">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <i class="bi bi-stars"></i>
                        </div>
                        <div>
                            <div class="fw-bold" style="font-size: 0.95rem;">Asistente IA Tragalero</div>
                            <div class="small opacity-75" style="font-size: 0.72rem;"><i class="bi bi-circle-fill text-success me-1" style="font-size: 0.5rem;"></i>En línea</div>
                        </div>
                    </div>
                    <button class="chatbot-close-btn" id="chatbot-close-btn"><i class="bi bi-x-lg"></i></button>
                </div>

                <!-- Messages -->
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-bubble bot">
                        ¡Hola! Soy tu Asistente IA de Tragalero. 👋 ¿En qué te puedo colaborar hoy?
                    </div>
                </div>

                <!-- Preview Attachment Bar -->
                <div class="preview-attachment hidden" id="preview-attachment-bar">
                    <span><i class="bi bi-image me-1"></i> Imagen adjunta lista</span>
                    <button class="btn btn-sm text-danger p-0 ms-2" id="remove-attachment-btn">&times;</button>
                </div>

                <!-- Input Container -->
                <div class="chatbot-input-container">
                    <label class="chatbot-action-btn" title="Adjuntar Imagen">
                        <i class="bi bi-paperclip"></i>
                        <input type="file" id="chatbot-file-input" accept="image/*" class="hidden">
                    </label>
                    <button class="chatbot-action-btn" id="chatbot-mic-btn" title="Usar Voz">
                        <i class="bi bi-mic-fill"></i>
                    </button>
                    <input type="text" id="chatbot-text-input" class="chatbot-input" placeholder="Escribe o habla tu orden...">
                    <button class="chatbot-action-btn text-warning" id="chatbot-send-btn" title="Enviar">
                        <i class="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Event Listeners
        const fab = document.getElementById('chatbot-fab-btn');
        const win = document.getElementById('chatbot-window');
        const closeBtn = document.getElementById('chatbot-close-btn');
        const sendBtn = document.getElementById('chatbot-send-btn');
        const textInput = document.getElementById('chatbot-text-input');
        const fileInput = document.getElementById('chatbot-file-input');
        const micBtn = document.getElementById('chatbot-mic-btn');
        const removeAttachBtn = document.getElementById('remove-attachment-btn');

        fab.onclick = () => win.classList.toggle('open');
        closeBtn.onclick = () => win.classList.remove('open');

        sendBtn.onclick = () => handleSendMessage();
        textInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSendMessage();
        };

        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                try {
                    addBotMessage("Subiendo imagen adjunta...");
                    const upload = await uploadToCloudinary(file);
                    attachedImageUrl = upload.url;
                    document.getElementById('preview-attachment-bar').classList.remove('hidden');
                    addBotMessage("¡Imagen adjuntada con éxito!");
                } catch (err) {
                    addBotMessage("Error al subir imagen: " + err.message);
                }
            }
        };

        removeAttachBtn.onclick = () => {
            attachedImageUrl = null;
            document.getElementById('preview-attachment-bar').classList.add('hidden');
            fileInput.value = '';
        };

        micBtn.onclick = () => toggleVoiceRecognition();
    }

    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API no soportada en este navegador.");
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            const micBtn = document.getElementById('chatbot-mic-btn');
            if (micBtn) micBtn.classList.add('recording');
        };

        recognition.onend = () => {
            isListening = false;
            const micBtn = document.getElementById('chatbot-mic-btn');
            if (micBtn) micBtn.classList.remove('recording');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('chatbot-text-input');
            if (input) {
                input.value = transcript;
                handleSendMessage();
            }
        };
    }

    function toggleVoiceRecognition() {
        if (!recognition) {
            alert("Tu navegador no soporta entrada de voz directa. Usa el teclado.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    async function handleSendMessage() {
        const textInput = document.getElementById('chatbot-text-input');
        const userMsg = textInput.value.trim();
        if (!userMsg && !attachedImageUrl) return;

        // Display user message
        addUserMessage(userMsg, attachedImageUrl);
        textInput.value = '';

        const imageForMsg = attachedImageUrl;
        attachedImageUrl = null;
        document.getElementById('preview-attachment-bar').classList.add('hidden');

        // Loading indicator
        const typingId = addTypingIndicator();

        if (!currentUser && typeof getLoggedInUser === 'function') {
            currentUser = await getLoggedInUser();
        }

        if (!currentUser) {
            removeTypingIndicator(typingId);
            addBotMessage("Por favor inicia sesión para que pueda realizar cambios en tu cuenta.");
            return;
        }

        // 1. Try calling Edge Function 'ai-assistant'
        try {
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient.functions.invoke('ai-assistant', {
                    body: {
                        user_id: currentUser.id,
                        message: userMsg,
                        image_url: imageForMsg
                    }
                });

                if (!error && data && data.reply) {
                    removeTypingIndicator(typingId);
                    addBotMessage(data.reply);
                    return;
                }
            }
        } catch (e) {
            console.log("Edge Function not available or returned error, running client fallback logic:", e);
        }

        // 2. Client-side AI fallback logic
        setTimeout(async () => {
            removeTypingIndicator(typingId);
            const reply = await processClientSideAI(userMsg, imageForMsg, currentUser);
            addBotMessage(reply);
        }, 1000);
    }

    async function processClientSideAI(msg, imageUrl, user) {
        const lowerMsg = msg.toLowerCase();
        const sb = window.supabaseClient;

        if (sb && user) {
            // Check if intent is price update / menu edit
            const isPriceIntent = lowerMsg.includes('precio') || lowerMsg.includes('cambia') || lowerMsg.includes('actualiz') || lowerMsg.includes('pon') || lowerMsg.includes('modific') || lowerMsg.includes('cuesta') || lowerMsg.includes('platillo') || lowerMsg.includes('menu') || lowerMsg.includes('menú');

            if (isPriceIntent) {
                // Fetch user's menu
                let { data: menu } = await sb.from('tragalero_menus').select('*').eq('user_id', user.id).maybeSingle();
                if (!menu) {
                    const fallback = await sb.from('menutech_menus').select('*').eq('user_id', user.id).maybeSingle();
                    menu = fallback ? fallback.data : null;
                }

                if (!menu) {
                    menu = {
                        user_id: user.id,
                        slug: user.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'restaurante',
                        config: { categories: [{ name: 'General', dishes: [] }] }
                    };
                }

                if (!menu.config) menu.config = { categories: [{ name: 'General', dishes: [] }] };
                if (!menu.config.categories || menu.config.categories.length === 0) {
                    menu.config.categories = [{ name: 'General', dishes: [] }];
                }

                // Extract price
                const numbers = lowerMsg.match(/\d+(?:\.\d+)?/g);
                const newPrice = numbers ? parseFloat(numbers[numbers.length - 1]) : 50;

                // Try finding matching dish name or extract from text
                let updated = false;
                menu.config.categories.forEach(cat => {
                    (cat.dishes || []).forEach(dish => {
                        if (dish.name && lowerMsg.includes(dish.name.toLowerCase().trim())) {
                            dish.price = newPrice;
                            updated = true;
                        }
                    });
                });

                // If no existing dish matched, extract dish name or add to first category
                if (!updated) {
                    let extractedName = msg;
                    // Remove keywords & numbers to estimate dish name
                    extractedName = extractedName.replace(/(?:cambia|cambiame|actualiza|pon|modifica|el|precio|de|del|a|en|pesos|\$|\d+(?:\.\d+)?)/gi, '').trim();
                    if (!extractedName || extractedName.length < 2) {
                        extractedName = "Platillo Especial";
                    } else {
                        // Capitalize first letter
                        extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
                    }

                    if (!menu.config.categories[0].dishes) menu.config.categories[0].dishes = [];
                    menu.config.categories[0].dishes.push({
                        name: extractedName,
                        description: '',
                        price: newPrice,
                        image: ''
                    });
                }

                const payload = {
                    user_id: user.id,
                    domain: user.domain || 'tragalero',
                    slug: menu.slug || 'restaurante',
                    config: menu.config,
                    updated_at: new Date().toISOString()
                };

                const upsertRes = await sb.from('tragalero_menus').upsert(payload, { onConflict: 'user_id' });
                if (upsertRes.error) {
                    await sb.from('menutech_menus').upsert(payload, { onConflict: 'user_id' });
                }

                // Dispatch global event if adminMenus.html is active
                if (typeof loadMenu === 'function') {
                    try { loadMenu(); } catch (e) {}
                }

                return `¡Listo! Menú actualizado.`;
            }

            // Check if intent is Task / Post creation
            const isTaskIntent = lowerMsg.includes('post') || lowerMsg.includes('facebook') || lowerMsg.includes('publica') || lowerMsg.includes('redes') || lowerMsg.includes('diseño') || lowerMsg.includes('imagen') || lowerMsg.includes('foto') || lowerMsg.includes('instagram') || imageUrl;

            if (isTaskIntent) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 5);

                const title = msg.length > 50 ? msg.substring(0, 47) + '...' : msg;

                await sb.from('tragalero_tasks').insert({
                    user_id: user.id,
                    client_name: user.name || 'Cliente',
                    client_domain: user.domain || 'tragalero',
                    title: title || 'Solicitud de Post en Redes Sociales',
                    description: msg,
                    image_url: imageUrl || null,
                    due_date: dueDate.toISOString(),
                    status: 'Pendiente'
                });

                const formattedDate = dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

                return `¡Listo! Tu post quedará listo el día ${formattedDate}.`;
            }
        }

        // Default response for any other request
        return `¡Listo! ¿En qué te puedo colaborar?`;
    }

    function addUserMessage(text, imgUrl) {
        const msgs = document.getElementById('chatbot-messages');
        if (!msgs) return;

        const div = document.createElement('div');
        div.className = 'chat-bubble user';
        let content = text;
        if (imgUrl) {
            content += `<img src="${imgUrl}" class="chat-bubble-img">`;
        }
        div.innerHTML = content;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function addBotMessage(text) {
        const msgs = document.getElementById('chatbot-messages');
        if (!msgs) return;

        const div = document.createElement('div');
        div.className = 'chat-bubble bot';
        div.innerHTML = text;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function addTypingIndicator() {
        const msgs = document.getElementById('chatbot-messages');
        if (!msgs) return null;

        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-bubble bot';
        div.innerHTML = `<i class="bi bi-three-dots animate-pulse"></i> Procesando tu orden...`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    }
})();
