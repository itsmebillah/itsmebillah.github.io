        function renderCertificates(certs) {
            const container = document.getElementById('certificatesContainer');
            if(!container || !certs || certs.length === 0) return;

            container.innerHTML = certs.map(c => {
                const name = escapeHtml(readObjProp(c, 'Name'));
                const org = escapeHtml(readObjProp(c, 'Organization'));
                const date = escapeHtml(readObjProp(c, 'Date'));
                const img = sanitizeUrl(readObjProp(c, 'ImageURL'), { image: true, allowImageData: true });
                const verify = sanitizeUrl(readObjProp(c, 'VerifyURL'));
                return `
                    <div class="glass rounded-3xl overflow-hidden group border border-white/5 hover:border-orange-500/40 transition duration-300">
                        <div class="relative h-48 overflow-hidden">
                            <img src="${escapeHtml(img || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&w=400')}" loading="lazy" decoding="async" width="400" height="192" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${name} certificate from ${org}">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-4">
                                <h3 class="text-white font-bold text-sm leading-snug">${name}</h3>
                                <p class="text-gray-400 text-[11px] mt-0.5">${org}</p>
                            </div>
                        </div>
                        <div class="p-4 flex justify-between items-center bg-black/10 text-[11px]">
                            <span class="text-orange-400 font-medium">${date}</span>
                            ${verify ? `<a href="${escapeHtml(verify)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1 bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white rounded-full transition"><i class="fas fa-external-link-alt mr-1"></i>Verify</a>`:''}
                        </div>
                    </div>`;
            }).join('');
        }
