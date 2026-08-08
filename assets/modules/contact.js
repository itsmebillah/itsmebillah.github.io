        function initializeFormSubmission() {
            const form = document.getElementById('contactForm');
            if(!form) return;
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const status = document.getElementById('formMessage');
                const btn = document.getElementById('submitBtn');
                
                btn.disabled = true;
                btn.textContent = "Streaming Packet To Sheets Core...";

                const formPayload = new URLSearchParams({
                    action: 'contact',
                    clientId: getPortfolioClientId(),
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    subject: document.getElementById('subject').value.trim(),
                    message: document.getElementById('message').value.trim()
                });

                try {
                    const response = await fetch(GAS_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                        body: formPayload.toString()
                    });
                    if (!response.ok) throw new Error(`Contact request failed with status ${response.status}`);
                    const result = await response.json();
                    if (!result || result.success !== true) {
                        throw new Error(result && result.error && result.error.code ? result.error.code : 'CONTACT_FAILED');
                    }
                    status.textContent = "Message received. I will respond as soon as possible.";
                    status.className = "mt-4 p-4 rounded-xl text-center text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20";
                    form.reset();
                } catch (error) {
                    status.textContent = "Message could not be sent. Please use the email link instead.";
                    status.className = "mt-4 p-4 rounded-xl text-center text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20";
                } finally {
                    status.classList.remove('hidden');
                    btn.disabled = false;
                    btn.textContent = "Execute Secure Transmission";
                    setTimeout(() => status.classList.add('hidden'), 5000);
                }
            });
        }
