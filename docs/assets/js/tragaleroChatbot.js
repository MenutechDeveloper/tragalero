/**
 * Tragalero AI Chatbot Widget
 * Integrates OpenAI Assistant / Gemini, Speech Recognition (Voice tool), Speech Synthesis (Voice output),
 * Drag-and-Drop Cloudinary image attachments, prominent 3D GLTF character, dynamic dish price updates in tragalero_menus,
 * business knowledge learning from tragalero_knowledge, and 5-day lead time task creation in tragalero_tasks.
 */

(function () {
    // 1. Inject CSS if not present
    if (!document.getElementById('tragalero-bootstrap-icons-css') && !document.querySelector('link[href*="bootstrap-icons"]')) {
        const biLink = document.createElement('link');
        biLink.id = 'tragalero-bootstrap-icons-css';
        biLink.rel = 'stylesheet';
        biLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
        document.head.appendChild(biLink);
    }

    if (!document.getElementById('tragalero-chatbot-css')) {
        const link = document.createElement('link');
        link.id = 'tragalero-chatbot-css';
        link.rel = 'stylesheet';
        link.href = './assets/css/chatbot.css';
        document.head.appendChild(link);
    }

    if (!document.querySelector('script[src*="model-viewer"]')) {
        const mvScript = document.createElement('script');
        mvScript.type = 'module';
        mvScript.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
        document.head.appendChild(mvScript);
    }

    let attachedImageUrl = null;
    let isListening = false;
    let recognition = null;
    let currentUser = null;
    let isTtsEnabled = localStorage.getItem('tragalero_chatbot_tts') !== 'false';

    // 2. Build DOM elements
    async function startChatbot() {
        initChatbotUI();
        initSpeechRecognition();
        if (typeof getLoggedInUser === 'function') {
            currentUser = await getLoggedInUser();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startChatbot);
    } else {
        startChatbot();
    }

    function initChatbotUI() {
        if (document.getElementById('tragalero-chatbot-container')) return;

        const container = document.createElement('div');
        container.id = 'tragalero-chatbot-container';
        container.innerHTML = `
            <!-- Floating Action Button with 3D GLTF Model -->
            <div class="tragalero-chatbot-fab" id="chatbot-fab-btn" title="Asistente IA Tragalero">
                <model-viewer
                    src="./assets/cs.gltf"
                    alt="Asistente IA Tragalero 3D"
                    camera-controls
                    disable-zoom
                    disable-pan
                    interaction-prompt="none"
                    shadow-intensity="1"
                    exposure="1"
                    camera-orbit="0deg 75deg 105%"
                    field-of-view="30deg"
                    loading="eager"
                    style="width: 100%; height: 100%; background: transparent; --poster-color: transparent; outline: none; cursor: grab;">
                </model-viewer>
            </div>

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
                    <div class="d-flex align-items-center gap-2">
                        <button class="chatbot-icon-btn ${isTtsEnabled ? 'active' : ''}" id="chatbot-tts-btn" title="${isTtsEnabled ? 'Voz activada (Clic para desactivar)' : 'Voz desactivada (Clic para activar)'}">
                            <i class="bi ${isTtsEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}"></i>
                        </button>
                        <button class="chatbot-close-btn" id="chatbot-close-btn"><i class="bi bi-x-lg"></i></button>
                    </div>
                </div>

                <!-- Prominent Character 3D Hero Stage inside Chat -->
                <div class="chatbot-hero-stage" id="chatbot-hero-stage">
                    <model-viewer
                        src="./assets/cs.gltf"
                        alt="Asistente IA Avatar 3D"
                        camera-controls
                        auto-rotate
                        disable-zoom
                        disable-pan
                        interaction-prompt="none"
                        shadow-intensity="1"
                        exposure="1"
                        camera-orbit="0deg 75deg 105%"
                        field-of-view="28deg"
                        loading="eager"
                        style="width: 100%; height: 100%; background: transparent; --poster-color: transparent; outline: none;">
                    </model-viewer>
                    <div class="speaking-badge">
                        <i class="bi bi-soundwave animate-pulse"></i> Hablando...
                    </div>
                </div>

                <!-- Messages -->
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-bubble bot">
                        ¡Hola! Soy tu Asistente IA de Tragalero. ¿En qué te puedo colaborar hoy? Puedes hablarme, escribirme o arrastrar imágenes.
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
                    <button class="chatbot-action-btn" id="chatbot-mic-btn" title="Usar Voz para Hablar">
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
        const ttsBtn = document.getElementById('chatbot-tts-btn');
        const removeAttachBtn = document.getElementById('remove-attachment-btn');

        let pointerDownX = 0;
        let pointerDownY = 0;

        fab.addEventListener('pointerdown', (e) => {
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
        });

        fab.addEventListener('click', (e) => {
            const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
            if (dist < 8) {
                win.classList.toggle('open');
            }
        });
        closeBtn.onclick = () => win.classList.remove('open');

        ttsBtn.onclick = () => {
            isTtsEnabled = !isTtsEnabled;
            localStorage.setItem('tragalero_chatbot_tts', isTtsEnabled ? 'true' : 'false');
            ttsBtn.className = `chatbot-icon-btn ${isTtsEnabled ? 'active' : ''}`;
            ttsBtn.title = isTtsEnabled ? 'Voz activada (Clic para desactivar)' : 'Voz desactivada (Clic para activar)';
            ttsBtn.innerHTML = `<i class="bi ${isTtsEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}"></i>`;
            if (!isTtsEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const heroStage = document.getElementById('chatbot-hero-stage');
                if (heroStage) heroStage.classList.remove('speaking');
            }
        };

        sendBtn.onclick = () => handleSendMessage();
        textInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSendMessage();
        };

        fileInput.onchange = async (e) => {
            if (e.target.files && e.target.files[0]) {
                await processImageFile(e.target.files[0]);
            }
        };

        removeAttachBtn.onclick = () => {
            attachedImageUrl = null;
            document.getElementById('preview-attachment-bar').classList.add('hidden');
            fileInput.value = '';
        };

        micBtn.onclick = () => toggleVoiceRecognition();

        // Setup Drag & Drop for Image Files onto Chatbot Window
        win.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            win.classList.add('drag-over');
        });

        win.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            win.classList.remove('drag-over');
        });

        win.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            win.classList.remove('drag-over');

            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile.type.startsWith('image/')) {
                    await processImageFile(droppedFile);
                } else {
                    addBotMessage("Por favor arrastra un archivo de imagen válido (JPG, PNG, WEBP, etc).");
                }
            }
        });
    }

    async function processImageFile(file) {
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

    function speakBotMessage(text) {
        if (!isTtsEnabled || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel(); // Stop any ongoing speech

        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-MX';

        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-ES') || v.lang.includes('es'));
        if (esVoice) utterance.voice = esVoice;

        const heroStage = document.getElementById('chatbot-hero-stage');
        if (heroStage) heroStage.classList.add('speaking');

        utterance.onend = () => {
            if (heroStage) heroStage.classList.remove('speaking');
        };

        utterance.onerror = () => {
            if (heroStage) heroStage.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utterance);
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

        // Determine target user ID (Check if admin is switching context on adminMenus.html)
        const targetUserId = (typeof activeOwnerId !== 'undefined' && activeOwnerId) ? activeOwnerId : currentUser.id;

        // 1. Call Edge Function 'ai-assistant' (Google Gemini / OpenAI compatible)
        try {
            const sbClient = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
            if (sbClient) {
                const { data, error } = await sbClient.functions.invoke('ai-assistant', {
                    body: {
                        user_id: targetUserId,
                        message: userMsg,
                        image_url: imageForMsg
                    }
                });

                if (!error && data && data.reply) {
                    removeTypingIndicator(typingId);
                    addBotMessage(data.reply);
                    if (typeof loadMenu === 'function') {
                        try { loadMenu(); } catch (e) {}
                    }
                    return;
                }

                if (data && data.error) {
                    removeTypingIndicator(typingId);
                    addBotMessage("Ocurrió un error en la IA: " + data.error);
                    return;
                }

                if (error) {
                    console.error("Error devuelto por la Edge Function de la IA:", error);
                    // Attempt local client-side AI fallback if edge function unavailable
                    const localReply = await processClientSideAI(userMsg, imageForMsg, targetUserId);
                    removeTypingIndicator(typingId);
                    addBotMessage(localReply);
                    return;
                }
            }
        } catch (e) {
            console.error("Error al conectar con la Edge Function:", e);
            const localReply = await processClientSideAI(userMsg, imageForMsg, targetUserId);
            removeTypingIndicator(typingId);
            addBotMessage(localReply);
            return;
        }

        removeTypingIndicator(typingId);
        addBotMessage("No se pudo recibir respuesta del asistente de IA. Verifica la configuración de Supabase Edge Function.");
    }

    async function processClientSideAI(msg, imageUrl, userIdArg) {
        const lowerMsg = msg.toLowerCase();
        const sb = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
        const targetUserId = (typeof userIdArg === 'string') ? userIdArg : (userIdArg ? userIdArg.id : currentUser?.id);

        if (sb && targetUserId) {
            // Check for learned business knowledge first
            try {
                const { data: knowledge } = await sb.from('tragalero_knowledge').select('*').eq('user_id', targetUserId);
                if (knowledge && knowledge.length > 0) {
                    for (const item of knowledge) {
                        if (item.title && lowerMsg.includes(item.title.toLowerCase().trim())) {
                            return item.content;
                        }
                    }
                }
            } catch (e) {}

            // Check for Menu Operations (Add dish, change price, add category, etc.)
            const isMenuIntent = lowerMsg.includes('agrega') || lowerMsg.includes('añade') || lowerMsg.includes('crea') || lowerMsg.includes('nuevo') || lowerMsg.includes('precio') || lowerMsg.includes('cambia') || lowerMsg.includes('actualiz') || lowerMsg.includes('pon') || lowerMsg.includes('modific') || lowerMsg.includes('cuesta') || lowerMsg.includes('platillo') || lowerMsg.includes('menu') || lowerMsg.includes('menú') || lowerMsg.includes('categoria') || lowerMsg.includes('categoría');

            if (isMenuIntent) {
                // Fetch user's current menu by targetUserId
                let { data: menu } = await sb.from('tragalero_menus').select('*').eq('user_id', targetUserId).maybeSingle();
                if (!menu) {
                    const fallback = await sb.from('menutech_menus').select('*').eq('user_id', targetUserId).maybeSingle();
                    menu = fallback ? fallback.data : null;
                }

                if (!menu) {
                    menu = {
                        user_id: targetUserId,
                        slug: 'restaurante',
                        config: { categories: [{ name: 'General', dishes: [] }] }
                    };
                }

                if (!menu.config) menu.config = { categories: [] };
                if (!menu.config.categories) menu.config.categories = [];
                if (menu.config.categories.length === 0) {
                    menu.config.categories.push({ name: 'General', dishes: [] });
                }

                // Check if user is asking to UPDATE an existing dish price
                const numbers = lowerMsg.match(/\d+(?:\.\d+)?/g);
                let targetPrice = numbers ? parseFloat(numbers[numbers.length - 1]) : null;

                let existingDishToUpdate = null;
                menu.config.categories.forEach(cat => {
                    (cat.dishes || []).forEach(dish => {
                        if (dish.name && lowerMsg.includes(dish.name.toLowerCase().trim())) {
                            existingDishToUpdate = dish;
                        }
                    });
                });

                if (existingDishToUpdate && targetPrice !== null) {
                    existingDishToUpdate.price = targetPrice;

                    const payload = {
                        user_id: targetUserId,
                        domain: menu.domain || 'tragalero',
                        slug: menu.slug || 'restaurante',
                        config: menu.config,
                        updated_at: new Date().toISOString()
                    };

                    const upsertRes = await sb.from('tragalero_menus').upsert(payload, { onConflict: 'user_id' });
                    if (upsertRes.error) {
                        await sb.from('menutech_menus').upsert(payload, { onConflict: 'user_id' });
                    }

                    if (typeof loadMenu === 'function') {
                        try { loadMenu(); } catch (e) {}
                    }

                    return `¡Listo! Menú actualizado.`;
                }

                // Otherwise: ADD A NEW DISH / CATEGORY
                let targetCategoryName = null;
                const categoryMatch = lowerMsg.match(/(?:categoria|categoría)\s+(?:de\s+)?([a-z0-9áéíóúñ\s]+?)(?=\s+(?:llamalo|llamado|llama|ponle|con|precio|chico|grande|$))/i);
                if (categoryMatch) {
                    targetCategoryName = categoryMatch[1].trim();
                }

                let targetCat = null;
                if (targetCategoryName) {
                    targetCat = menu.config.categories.find(c => (c.name || '').toLowerCase().includes(targetCategoryName.toLowerCase()));
                }
                if (!targetCat) {
                    if (targetCategoryName) {
                        const formattedCatName = targetCategoryName.charAt(0).toUpperCase() + targetCategoryName.slice(1);
                        targetCat = { name: formattedCatName, description: '', dishes: [] };
                        menu.config.categories.push(targetCat);
                    } else {
                        targetCat = menu.config.categories[0];
                    }
                }
                if (!targetCat.dishes) targetCat.dishes = [];

                let dishName = null;
                const dishMatch = lowerMsg.match(/(?:llamalo|llamado|llama|nombrado)\s+([a-z0-9áéíóúñ\s]+?)(?=\s+(?:ponle|con|precio|chico|grande|tamaño|\d+|$))/i);
                if (dishMatch) {
                    dishName = dishMatch[1].trim();
                }

                if (!dishName) {
                    let cleaned = msg.replace(/(?:agrega|añade|crea|un|nuevo|platillo|a|la|categoria|categoría|de|en|el|menu|menú|llamalo|llamado|llama|ponle|pon|\d+)/gi, '').trim();
                    if (cleaned.length > 1) {
                        dishName = cleaned.split(/\s+(?:chico|grande|precio|con|tamaño)/i)[0].trim();
                    }
                }

                if (!dishName || dishName.length < 2) {
                    dishName = "Nuevo Platillo";
                }
                dishName = dishName.charAt(0).toUpperCase() + dishName.slice(1);

                const sizes = [];
                const sizeMatches = [...msg.matchAll(/(chico|mediano|grande|familiar|personal|mini)\s+(\d+(?:\.\d+)?)/gi)];

                if (sizeMatches.length > 0) {
                    sizeMatches.forEach(m => {
                        const szName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
                        const szPrice = parseFloat(m[2]);
                        sizes.push({ name: szName, price: szPrice });
                    });
                }

                let defaultPrice = 0;
                if (sizes.length > 0) {
                    defaultPrice = sizes[0].price;
                } else if (numbers) {
                    defaultPrice = parseFloat(numbers[numbers.length - 1]);
                }

                const newDishObj = {
                    name: dishName,
                    description: '',
                    price: defaultPrice,
                    image: '',
                    sizes: sizes
                };
                targetCat.dishes.push(newDishObj);

                const payload = {
                    user_id: targetUserId,
                    domain: menu.domain || 'tragalero',
                    slug: menu.slug || 'restaurante',
                    config: menu.config,
                    updated_at: new Date().toISOString()
                };

                const upsertRes = await sb.from('tragalero_menus').upsert(payload, { onConflict: 'user_id' });
                if (upsertRes.error) {
                    await sb.from('menutech_menus').upsert(payload, { onConflict: 'user_id' });
                }

                if (typeof loadMenu === 'function') {
                    try { loadMenu(); } catch (e) {}
                }

                return `¡Listo! Menú actualizado.`;
            }

            // Check if intent is CS Task / Post creation
            const isTaskIntent = lowerMsg.includes('post') || lowerMsg.includes('facebook') || lowerMsg.includes('publica') || lowerMsg.includes('redes') || lowerMsg.includes('diseño') || lowerMsg.includes('imagen') || lowerMsg.includes('foto') || lowerMsg.includes('instagram') || imageUrl;

            if (isTaskIntent) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 5);

                const title = msg.length > 50 ? msg.substring(0, 47) + '...' : msg;

                await sb.from('tragalero_tasks').insert({
                    user_id: targetUserId,
                    client_name: currentUser?.name || 'Cliente',
                    client_domain: currentUser?.domain || 'tragalero',
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

        return `¡Listo! ¿En qué más te colaboro?`;
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

        // Speak aloud if TTS enabled
        speakBotMessage(text);
    }

    function addTypingIndicator() {
        const msgs = document.getElementById('chatbot-messages');
        if (!msgs) return null;

        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-bubble bot';
        div.innerHTML = `<i class="bi bi-three-dots animate-pulse"></i> Procesando tu solicitud...`;
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
