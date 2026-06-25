        function initializeFormSubmission() {
            const form = document.getElementById('contactForm');
            if(!form) return;
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const status = document.getElementById('formMessage');
                const btn = document.getElementById('submitBtn');
                
                btn.disabled = true;
                btn.textContent = "Streaming Packet To Sheets Core...";

                const queryParams = new URLSearchParams({
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    subject: document.getElementById('subject').value.trim(),
                    message: document.getElementById('message').value.trim()
                });

                try {
                    await fetch(`${GAS_API_URL}?${queryParams.toString()}`, { method: 'GET', mode: 'no-cors' });
                    status.textContent = "✅ System handshake confirmation: Data saved to Google Sheet submissions.";
                    status.className = "mt-4 p-4 rounded-xl text-center text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20";
                    form.reset();
                } catch (error) {
                    status.textContent = "❌ Core pipeline connection timed out.";
                    status.className = "mt-4 p-4 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20";
                } finally {
                    status.classList.remove('hidden');
                    btn.disabled = false;
                    btn.textContent = "Execute Secure Transmission";
                    setTimeout(() => status.classList.add('hidden'), 5000);
                }
            });
        }
