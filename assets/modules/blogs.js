        function renderBlogs(blogsData) {
            const container = document.getElementById('blogsContainer');
            if(!container || !blogsData || blogsData.length === 0) return;
            allBlogs = blogsData;

            container.innerHTML = blogsData.map((b, idx) => {
                const title = escapeHtml(readObjProp(b, 'Title'));
                const thumb = sanitizeUrl(readObjProp(b, 'Thumbnail'), { image: true, allowImageData: true });
                const cat = escapeHtml(readObjProp(b, 'Category'));
                const desc = escapeHtml(readObjProp(b, 'Description'));
                const date = escapeHtml(readObjProp(b, 'Date'));
                const rTime = escapeHtml(readObjProp(b, 'ReadTime') || 5);

                return `
                    <div class="glass rounded-3xl overflow-hidden flex flex-col md:flex-row border border-white/5 hover:border-orange-500/30 transition">
                        <div class="md:w-1/3 h-40 md:h-auto"><img src="${escapeHtml(thumb)}" loading="lazy" decoding="async" width="400" height="160" class="w-full h-full object-cover" alt="${title} case study thumbnail"></div>
                        <div class="p-5 md:w-2/3 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-1.5 text-[10px]">
                                    <span class="font-bold text-orange-500 uppercase tracking-wider">${cat || 'Case Study'}</span>
                                    <span class="text-gray-500"><i class="far fa-clock mr-1"></i>${rTime} min read</span>
                                </div>
                                <h3 class="text-base font-bold text-white mb-1.5 line-clamp-2 leading-tight">${title}</h3>
                                <p class="text-gray-400 text-[11px] mb-4 line-clamp-3 leading-relaxed">${desc}</p>
                            </div>
                            <div class="flex justify-between items-center text-[11px]">
                                <span class="text-gray-500">${date}</span>
                                <button onclick="openBlogModal(${idx})" type="button" class="text-white font-semibold hover:text-orange-500 flex items-center">Read Segment <i class="fas fa-arrow-right ml-1.5 text-[9px]"></i></button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        async function openBlogModal(index) {
            if (!allBlogs[index]) return;
            const blog = allBlogs[index];
            const modal = document.getElementById('blogModal');
            const modalBody = document.getElementById('modalBody');
            
            const cat = escapeHtml(readObjProp(blog, 'Category'));
            const title = escapeHtml(readObjProp(blog, 'Title'));
            const thumb = sanitizeUrl(readObjProp(blog, 'Thumbnail'), { image: true, allowImageData: true });
            const docId = readObjProp(blog, 'DocID') || readObjProp(blog, 'GoogleDocID');
            const slug = readObjProp(blog, 'Slug');

            modalBody.innerHTML = `
                <div class="mb-3"><span class="text-orange-500 font-bold uppercase text-[11px] tracking-widest">${cat}</span></div>
                <h1 id="blogModalTitle" class="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">${title}</h1>
                <img src="${escapeHtml(thumb)}" loading="lazy" decoding="async" width="800" height="224" class="w-full h-56 object-cover rounded-xl mb-5 border border-white/10" alt="${title} case study image">
                <div class="text-gray-300 leading-relaxed space-y-4 text-xs bg-white/5 p-4 rounded-xl max-h-[260px] overflow-y-auto font-normal">
                    <div class="animate-pulse text-gray-500">Loading full case study...</div>
                </div>`;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            try {
                let content = escapeHtml(readObjProp(blog, 'Description'));
                const blogParams = new URLSearchParams({ action: 'getBlog' });
                if (docId) blogParams.set('docId', docId);
                if (slug) blogParams.set('slug', slug);
                blogParams.set('title', readObjProp(blog, 'Title'));
                const response = await fetch(`${GAS_API_URL}?${blogParams.toString()}`);
                if (!response.ok) throw new Error(`Blog API request failed with status ${response.status}`);
                const result = await response.json();
                if (result && result.success && result.content) {
                    const sanitizedContent = sanitizeHtml(result.content);
                    if (sanitizedContent.trim()) content = sanitizedContent;
                }
                
                modalBody.innerHTML = `
                    <div class="mb-3"><span class="text-orange-500 font-bold uppercase text-[11px] tracking-widest">${cat}</span></div>
                    <h1 id="blogModalTitle" class="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">${title}</h1>
                    <img src="${escapeHtml(thumb)}" loading="lazy" decoding="async" width="800" height="224" class="w-full h-56 object-cover rounded-xl mb-5 border border-white/10" alt="${title} case study image">
                    <div class="text-gray-300 leading-relaxed space-y-4 text-xs bg-white/5 p-4 rounded-xl max-h-[260px] overflow-y-auto font-normal">
                        ${content}
                    </div>`;
            } catch (error) {
                console.error('Blog content fetch failure:', error);
                modalBody.innerHTML = `
                    <div class="mb-3"><span class="text-orange-500 font-bold uppercase text-[11px] tracking-widest">${cat}</span></div>
                    <h1 id="blogModalTitle" class="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">${title}</h1>
                    <img src="${escapeHtml(thumb)}" loading="lazy" decoding="async" width="800" height="224" class="w-full h-56 object-cover rounded-xl mb-5 border border-white/10" alt="${title} case study image">
                    <div class="text-gray-300 leading-relaxed space-y-4 text-xs bg-white/5 p-4 rounded-xl max-h-[260px] overflow-y-auto font-normal">
                        ${escapeHtml(readObjProp(blog, 'Description') || 'Blog content could not be loaded. Please try again later.')}
                    </div>`;
            }
        }

        function closeBlogModal() {
            document.getElementById('blogModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
