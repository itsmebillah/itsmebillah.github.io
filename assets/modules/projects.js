        function renderProjects(projects) {
            const featContainer = document.getElementById('featuredProjectsContainer');
            const otherContainer = document.getElementById('otherProjectsContainer');
            if(!projects || projects.length === 0) return;

            const projectValue = (project, modernKey, legacyKey) => {
                const modern = readObjProp(project, modernKey);
                return modern !== '' && modern !== undefined && modern !== null
                    ? modern
                    : readObjProp(project, legacyKey || modernKey);
            };
            const isFeatured = project => {
                const value = projectValue(project, 'featured', 'Featured');
                return value === true || String(value).toUpperCase() === 'TRUE';
            };
            const ordered = projects.slice().sort((a, b) =>
                (Number(projectValue(a, 'displayOrder', 'Order')) || 999) -
                (Number(projectValue(b, 'displayOrder', 'Order')) || 999)
            );
            const featured = ordered.filter(isFeatured);
            const others = ordered.filter(project => !isFeatured(project));
            const projectImage = (project, classes, width, height) => {
                const name = escapeHtml(projectValue(project, 'title', 'Name'));
                const image = sanitizeUrl(projectValue(project, 'image', 'Image'), { image: true, allowImageData: true });
                const alt = escapeHtml(projectValue(project, 'imageAlt') || `${projectValue(project, 'title', 'Name')} project preview`);
                if (!image) return `<div class="${classes} project-image-fallback border border-white/10 bg-white/5 flex items-center justify-center text-gray-500 text-xs">Project preview unavailable</div>`;
                return `<div class="relative"><img src="${escapeHtml(image)}" loading="lazy" decoding="async" width="${width}" height="${height}" class="${classes}" alt="${alt}" data-project-image><div class="${classes} project-image-fallback hidden border border-white/10 bg-white/5 items-center justify-center text-gray-500 text-xs" aria-hidden="true">Project preview unavailable</div></div>`;
            };

            if(featContainer) {
                featContainer.innerHTML = featured.map(p => {
                    const name = escapeHtml(projectValue(p, 'title', 'Name'));
                    const desc = escapeHtml(projectValue(p, 'description', 'Description'));
                    const tags = projectValue(p, 'techStack', 'Tags');
                    const tagList = Array.isArray(tags) ? tags : String(tags || '').split(',').filter(Boolean);
                    const live = sanitizeUrl(projectValue(p, 'demoUrl', 'LiveURL'));
                    const git = sanitizeUrl(projectValue(p, 'url', 'GitHubURL'));

                    return `
                        <div class="glass rounded-3xl p-8 mb-8 border border-white/10">
                            <div class="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h3 class="text-2xl font-bold mb-3 gradient-text">🚀 ${name}</h3>
                                    <p class="text-gray-300 text-sm leading-relaxed mb-5">${desc}</p>
                                    <div class="flex flex-wrap gap-1.5 mb-5">
                                        ${tagList.map(t => `<span class="project-tag">${escapeHtml(String(t).trim())}</span>`).join('')}
                                    </div>
                                    <div class="flex gap-4">
                                        ${live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white text-xs font-semibold tracking-wide"><i class="fas fa-external-link-alt mr-2"></i>Live Framework</a>`:''}
                                        ${git && git !== '#' ? `<a href="${escapeHtml(git)}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 glass rounded-full text-white text-xs font-semibold tracking-wide border border-white/20"><i class="fab fa-github mr-2"></i>Repository</a>`:''}
                                    </div>
                                </div>
                                <div class="text-center">${projectImage(p, 'w-full h-56 object-cover rounded-2xl shadow-2xl border border-white/10', 800, 448)}</div>
                            </div>
                        </div>`;
                }).join('');
            }

            if(otherContainer) {
                otherContainer.innerHTML = others.map(p => {
                    const name = escapeHtml(projectValue(p, 'title', 'Name'));
                    const desc = escapeHtml(projectValue(p, 'description', 'Description'));
                    const tags = projectValue(p, 'techStack', 'Tags');
                    const tagList = Array.isArray(tags) ? tags : String(tags || '').split(',').filter(Boolean);
                    const live = sanitizeUrl(projectValue(p, 'demoUrl', 'LiveURL'));
                    const git = sanitizeUrl(projectValue(p, 'url', 'GitHubURL'));

                    return `
                        <div class="glass rounded-2xl p-5 flex flex-col justify-between border border-white/5 hover:border-orange-500/30 transition duration-300">
                            <div>
                                ${projectImage(p, 'w-full h-40 object-cover rounded-xl mb-4 border border-white/5', 400, 160)}
                                <h4 class="text-lg font-bold mb-2 text-white">${name}</h4>
                                <p class="text-gray-400 text-xs mb-4 line-clamp-3 leading-relaxed">${desc}</p>
                                <div class="flex flex-wrap gap-1 mb-2">
                                    ${tagList.slice(0,3).map(t => `<span class="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]">${escapeHtml(String(t).trim())}</span>`).join('')}
                                </div>
                            </div>
                            <div class="flex justify-between items-center mt-4">
                                ${live ? `<a href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer" class="text-orange-400 text-xs font-semibold flex items-center">Live project <i class="fas fa-arrow-right ml-1.5 text-[10px]"></i></a>` : git ? `<a href="${escapeHtml(git)}" target="_blank" rel="noopener noreferrer" class="text-orange-400 text-xs font-semibold flex items-center">Repository <i class="fas fa-arrow-right ml-1.5 text-[10px]"></i></a>` : ''}
                            </div>
                        </div>`;
                }).join('');
            }

            document.querySelectorAll('[data-project-image]').forEach(image => {
                image.addEventListener('error', () => {
                    const fallback = image.nextElementSibling;
                    image.classList.add('hidden');
                    if (fallback) {
                        fallback.classList.remove('hidden');
                        fallback.classList.add('flex');
                        fallback.setAttribute('aria-hidden', 'false');
                    }
                }, { once: true });
            });
        }
