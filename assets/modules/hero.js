        function renderProfile(p) {
            if(!p) return;
            const name = readObjProp(p, 'Name');
            const title = readObjProp(p, 'Title');
            const bio = readObjProp(p, 'Bio');
            const heroQuote = readObjProp(p, 'HeroQuote');
            const about = readObjProp(p, 'AboutMe') || bio;
            const loc = readObjProp(p, 'Location');
            const email = readObjProp(p, 'Email');
            const phone = readObjProp(p, 'Phone');
            const fb = sanitizeUrl(readObjProp(p, 'Facebook')) || "#";
            const ln = sanitizeUrl(readObjProp(p, 'LinkedIn')) || "#";
            const wa = readObjProp(p, 'WhatsApp');
            const waUrl = sanitizeUrl(String(wa || "").startsWith("http") ? wa : `https://wa.me/${String(wa || "").replace(/\D/g, "")}`) || "#";
            const gh = sanitizeUrl(readObjProp(p, 'GitHub')) || "#";
            const pic = readObjProp(p, 'ProfilePic');

            document.getElementById('navName').textContent = name;
            document.getElementById('heroName').textContent = name;
            document.getElementById('heroTitle').textContent = title;
            document.getElementById('heroBio').textContent = heroQuote || bio;
            document.getElementById('aboutBio').textContent = about;
            document.getElementById('infoLocation').textContent = loc;
            document.getElementById('infoEmail').textContent = email;
            document.getElementById('infoPhone').textContent = phone;
            const profileImage = document.getElementById('profileImage');
            const profileFallback = document.getElementById('profileImageFallback');
            const manualImage = sanitizeUrl(pic, { image: true, allowImageData: true });
            profileImage.onerror = () => {
                profileImage.classList.add('hidden');
                if (profileFallback) {
                    profileFallback.classList.remove('hidden');
                    profileFallback.classList.add('flex');
                    profileFallback.setAttribute('aria-hidden', 'false');
                }
            };
            profileImage.onload = () => {
                profileImage.classList.remove('hidden');
                if (profileFallback) {
                    profileFallback.classList.add('hidden');
                    profileFallback.classList.remove('flex');
                    profileFallback.setAttribute('aria-hidden', 'true');
                }
            };
            if (profileFallback) profileFallback.querySelector('span').textContent = String(name || 'Portfolio').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
            if (manualImage) profileImage.src = manualImage;
            else profileImage.onerror();
            profileImage.alt = `Portrait of ${name}`;
            profileImage.decoding = 'async';
            profileImage.fetchPriority = 'high';
            profileImage.loading = 'eager';

            const socials = document.getElementById('socialContainer');
            if(socials) {
                socials.innerHTML = `
                    <a href="${escapeHtml(ln)}" class="text-gray-400 hover:text-white text-xl transition magnetic-btn" target="_blank" rel="noopener noreferrer" aria-label="Visit LinkedIn profile"><i class="fab fa-linkedin"></i></a>
                    <a href="${escapeHtml(gh)}" class="text-gray-400 hover:text-white text-xl transition magnetic-btn" target="_blank" rel="noopener noreferrer" aria-label="Visit GitHub profile"><i class="fab fa-github"></i></a>
                    <a href="${escapeHtml(fb)}" class="text-gray-400 hover:text-white text-xl transition magnetic-btn" target="_blank" rel="noopener noreferrer" aria-label="Visit Facebook profile"><i class="fab fa-facebook"></i></a>
                    <a href="${escapeHtml(waUrl)}" class="text-gray-400 hover:text-white text-xl transition magnetic-btn" target="_blank" rel="noopener noreferrer" aria-label="Open WhatsApp chat"><i class="fab fa-whatsapp"></i></a>
                `;
            }
        }
