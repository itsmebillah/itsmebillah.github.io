        function initializeChatbotEngine() {
            const toggle = document.getElementById('chatToggle');
            const win = document.getElementById('chatWindow');
            const close = document.getElementById('closeChat');
            const send = document.getElementById('sendChat');
            const input = document.getElementById('chatInput');
            const msgs = document.getElementById('chatMessages');

            if(!toggle || !win) return;

            toggle.addEventListener('click', () => win.classList.remove('hidden'));
            close.addEventListener('click', () => win.classList.add('hidden'));
            send.addEventListener('click', dispatchChatMessagePipeline);
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') dispatchChatMessagePipeline(); });

            async function dispatchChatMessagePipeline() {
                const message = input.value.trim();
                if (!message) return;

                appendMsg(message, 'user');
                input.value = '';

                const typingIndicator = document.createElement('div');
                typingIndicator.className = "flex";
                typingIndicator.innerHTML = `<div class="bg-white/5 text-gray-500 px-4 py-2 rounded-2xl animate-pulse text-[11px]">Agent executing context lookup...</div>`;
                msgs.appendChild(typingIndicator);
                msgs.scrollTop = msgs.scrollHeight;

                try {
                    const chatEndpoint = (typeof API_URL !== 'undefined' && API_URL) ? API_URL : GAS_API_URL;
                    if (!chatEndpoint) throw new Error('Chat API endpoint is unavailable.');

                    const chatParams = new URLSearchParams({
                        action: 'chat',
                        message,
                        clientId: getPortfolioClientId()
                    });
                    const response = await fetch(`${chatEndpoint}?${chatParams.toString()}`);
                    if (!response.ok) throw new Error(`Chat API request failed with status ${response.status}`);

                    const result = await response.json();
                    typingIndicator.remove();
                    appendMsg(result && result.reply ? result.reply : "Chat response was unavailable. Please try again later.", 'bot');
                } catch (error) {
                    console.error('Chat pipeline failure:', error);
                    typingIndicator.remove();
                    appendMsg("Chat service is temporarily unavailable. Please try again later.", 'bot');
                }
            }

            function appendMsg(text, sender) {
                const box = document.createElement('div');
                box.className = sender === 'user' ? "flex justify-end" : "flex";
                const safeText = String(text || "").replace(/[&<>"']/g, char => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                })[char]);
                box.innerHTML = sender === 'user' 
                    ? `<div class="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2.5 rounded-2xl max-w-[85%] font-medium">${safeText}</div>`
                    : `<div class="bg-white/10 text-gray-200 px-4 py-2.5 rounded-2xl max-w-[85%]">${safeText.replace(/\n/g, '<br>')}</div>`;
                msgs.appendChild(box);
                msgs.scrollTop = msgs.scrollHeight;
            }
        }

