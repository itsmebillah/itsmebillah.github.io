        function renderProjects(projects) {
            const featContainer = document.getElementById('featuredProjectsContainer');
            const otherContainer = document.getElementById('otherProjectsContainer');
            if(!projects || projects.length === 0) return;

            const featured = projects.filter(p => String(readObjProp(p, 'Featured')).toUpperCase() === 'TRUE' || readObjProp(p, 'Featured') === true);
            const others = projects.filter(p => String(readObjProp(p, 'Featured')).toUpperCase() !== 'TRUE' && readObjProp(p, 'Featured') !== true);

            if(featContainer) {
                featContainer.innerHTML = featured.map(p => {
                    const name = escapeHtml(readObjProp(p, 'Name'));
                    const desc = escapeHtml(readObjProp(p, 'Description'));
                    const img = sanitizeUrl(readObjProp(p, 'Image'), { image: true, allowImageData: true });
                    const tags = readObjProp(p, 'Tags');
                    const live = sanitizeUrl(readObjProp(p, 'LiveURL'));
                    const git = sanitizeUrl(readObjProp(p, 'GitHubURL'));
                    const de = escapeHtml(readObjProp(p, 'DemoEmail'));
                    const dp = escapeHtml(readObjProp(p, 'DemoPassword'));

                    return `
                        <div class="glass rounded-3xl p-8 mb-8 border border-white/10">
                            <div class="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 class="text-2xl font-bold mb-3 gradient-text">🚀 ${name}</h3>
                                    <p class="text-gray-300 text-sm leading-relaxed mb-5">${desc}</p>
                                    <div class="flex flex-wrap gap-1.5 mb-5">
                                        ${tags ? tags.split(',').map(t => `<span class="project-tag">${escapeHtml(t.trim())}</span>`).join('') : ''}
                                    </div>
                                    ${de ? `
                                        <div class="mb-5 text-xs bg-white/5 p-3 rounded-xl border border-white/5 space-y-1 tracking-wide">
                                            <div><span class="text-orange-400 font-semibold">Demo Access:</span> ${de}</div>
                                            <div><span class="text-orange-400 font-semibold">Pass:</span> ${dp}</div>
                                        </div>`: ''}
                                    <div class="flex gap-4">
                                        ${live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white text-xs font-semibold tracking-wide"><i class="fas fa-external-link-alt mr-2"></i>Live Framework</a>`:''}
                                        ${git && git !== '#' ? `<a href="${escapeHtml(git)}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 glass rounded-full text-white text-xs font-semibold tracking-wide border border-white/20"><i class="fab fa-github mr-2"></i>Repository</a>`:''}
                                    </div>
                                </div>
                                <div class="text-center"><img src="${escapeHtml(img)}" loading="lazy" decoding="async" width="800" height="448" class="w-full h-56 object-cover rounded-2xl shadow-2xl border border-white/10" alt="${name} project preview"></div>
                            </div>
                        </div>`;
                }).join('');
            }

            if(otherContainer) {
                otherContainer.innerHTML = others.map(p => {
                    const name = escapeHtml(readObjProp(p, 'Name'));
                    const desc = escapeHtml(readObjProp(p, 'Description'));
                    const img = sanitizeUrl(readObjProp(p, 'Image'), { image: true, allowImageData: true });
                    const tags = readObjProp(p, 'Tags');
                    const live = sanitizeUrl(readObjProp(p, 'LiveURL'));

                    return `
                        <div class="glass rounded-2xl p-5 flex flex-col justify-between border border-white/5 hover:border-orange-500/30 transition duration-300">
                            <div>
                                <img src="${escapeHtml(img)}" loading="lazy" decoding="async" width="400" height="160" class="w-full h-40 object-cover rounded-xl mb-4 border border-white/5" alt="${name} project preview">
                                <h4 class="text-lg font-bold mb-2 text-white">${name}</h4>
                                <p class="text-gray-400 text-xs mb-4 line-clamp-3 leading-relaxed">${desc}</p>
                                <div class="flex flex-wrap gap-1 mb-2">
                                    ${tags ? tags.split(',').slice(0,3).map(t => `<span class="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]">${escapeHtml(t.trim())}</span>`).join('') : ''}
                                </div>
                            </div>
                            <div class="flex justify-between items-center mt-4">
                                ${live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer" class="text-orange-400 text-xs font-semibold flex items-center">Initialize Node <i class="fas fa-arrow-right ml-1.5 text-[10px]"></i></a>`:''}
                            </div>
                        </div>`;
                }).join('');
            }
        }
