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
                            <div class="small opacity-75" style="font-size: 0.72rem;"><i class="bi bi-circle-fill text-success me-1" style="font-size: 0.5rem;"></i>En línea • Permisos Admin</div>
                        </div>
                    </div>
                    <button class="chatbot-close-btn" id="chatbot-close-btn"><i class="bi bi-x-lg"></i></button>
                </div>

                <!-- Messages -->
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="chat-bubble bot">
                        ¡Hola! Soy tu Asistente IA de Tragalero. 👋<br><br>
                        Puedo ayudarte a <b>cambiar precios de platillos en tu menú por voz o chat</b> (ej: <i>"Cámbiame el precio de las Enchiladas a 50 pesos"</i>) o agendar solicitudes para redes sociales con <b>5 días de anticipación</b> para tu ejecutivo de CS.
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

        // A) DISH PRICE UPDATE PATTERN
        // Match phrases like "cambia el precio de X a Y", "cambiar precio de X a 50", "precio de X a 60 pesos"
        const pricePattern = /(?:cambi|actualiz|pon|modific).*?(?:precio).*?(?:de|del)?\s+([a-záéíóúñ\s]+?)\s+(?:a|en)\s+\$?(\d+(?:\.\d+)?)/i;
        const priceMatch = lowerMsg.match(pricePattern) || lowerMsg.match(/(?:precio).*?([a-záéíóúñ\s]+?)\s+(?:a|en)\s+\$?(\d+(?:\.\d+)?)/i);

        if (priceMatch) {
            const rawDishName = priceMatch[1].trim();
            const newPrice = parseFloat(priceMatch[2]);

            if (sb && user) {
                // Fetch user's menu from tragalero_menus or menutech_menus
                let { data: menu } = await sb.from('tragalero_menus').select('*').eq('user_id', user.id).maybeSingle();
                if (!menu) {
                    const fallback = await sb.from('menutech_menus').select('*').eq('user_id', user.id).maybeSingle();
                    menu = fallback.data;
                }

                if (menu && menu.config && menu.config.categories) {
                    let updated = false;
                    let foundName = rawDishName;

                    menu.config.categories.forEach(cat => {
                        (cat.dishes || []).forEach(dish => {
                            if ((dish.name || '').toLowerCase().includes(rawDishName.toLowerCase())) {
                                dish.price = newPrice;
                                foundName = dish.name;
                                updated = true;
                            }
                        });
                    });

                    if (updated) {
                        await sb.from('tragalero_menus').upsert({
                            user_id: user.id,
                            config: menu.config,
                            updated_at: new Date()
                        }, { onConflict: 'user_id' });

                        return `¡Listo, ${user.name || 'Owner'}! He entrado a tu cuenta y he actualizado el precio del platillo <b>"${foundName}"</b> a <b>$${newPrice} MXN</b> en tu menú digital.`;
                    } else {
                        return `No logré encontrar un platillo parecido a "${rawDishName}" en tu menú actual. Por favor verifica el nombre.`;
                    }
                } else {
                    return `No tienes un menú creado todavía. Puedes crearlo en la sección de Menús Digitales.`;
                }
            }
        }

        // B) EXTERNAL REQUEST / FACEBOOK POST / CS TASK CREATION
        // Match requests for posts, facebook, design, social media, custom tasks
        if (lowerMsg.includes('post') || lowerMsg.includes('facebook') || lowerMsg.includes('publica') || lowerMsg.includes('redes') || lowerMsg.includes('diseño') || imageUrl) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5);

            if (sb && user) {
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

                return `¡Perfecto, ${user.name || 'Cliente'}! He registrado tu tarea en el panel de Atención a Clientes (CS).<br><br>Quedó programada para el día <b>${formattedDate}</b> (dando los 5 días de anticipación). Tu ejecutivo asignado revisará la imagen y los detalles para completar la publicación.`;
            }
        }

        // C) DEFAULT ASSISTANT RESPONSE
        return `Entendido. Puedo ayudarte a:<br>
        1. <b>Cambiar precios de platillos</b> (ej: "Cámbiame el precio de las Enchiladas a 50 pesos").<br>
        2. <b>Agendar posts de Facebook / Solicitudes CS</b> con imagen adjunta y 5 días de anticipación.`;
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
