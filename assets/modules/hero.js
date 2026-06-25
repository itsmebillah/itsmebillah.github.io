        function renderProfile(p) {
            if(!p) return;
            const name = readObjProp(p, 'Name') || "Md. Masum Billah";
            const title = readObjProp(p, 'Title') || "Data Analyst & Automation Expert";
            const bio = readObjProp(p, 'Bio');
            const loc = readObjProp(p, 'Location');
            const email = readObjProp(p, 'Email');
            const phone = readObjProp(p, 'Phone');
            const fb = sanitizeUrl(readObjProp(p, 'Facebook')) || "#";
            const ln = sanitizeUrl(readObjProp(p, 'LinkedIn')) || "#";
            const wa = readObjProp(p, 'WhatsApp');
            const waUrl = sanitizeUrl(String(wa || "").startsWith("http") ? wa : `https://wa.me/${String(wa || "").replace(/\D/g, "")}`) || "#";
            const gh = sanitizeUrl(readObjProp(p, 'GitHub')) || "#";
            const pic = readObjProp(p, 'ProfilePic') || "https://i.postimg.cc/66D9MZLk/Gemini-Generated-Image-4q2cn54q2cn54q2c.png";

            document.getElementById('navName').textContent = name;
            document.getElementById('heroName').textContent = name;
            document.getElementById('heroTitle').textContent = title;
            document.getElementById('heroBio').textContent = bio;
            document.getElementById('aboutBio').textContent = bio;
            document.getElementById('infoLocation').textContent = loc;
            document.getElementById('infoEmail').textContent = email;
            document.getElementById('infoPhone').textContent = phone;
            document.getElementById('profileImage').src = sanitizeUrl(pic, { image: true, allowImageData: true }) || "https://i.postimg.cc/66D9MZLk/Gemini-Generated-Image-4q2cn54q2cn54q2c.png";
            document.getElementById('profileImage').alt = `Portrait of ${name}`;

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
