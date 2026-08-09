        function renderTimeline(exp, edu) {
            const container = document.getElementById('timelineContainer');
            if(!container) return;

            const unifiedList = [];
            if(exp) exp.forEach(i => unifiedList.push({...i, blockType: 'exp'}));
            if(edu) edu.forEach(i => unifiedList.push({...i, blockType: 'edu'}));
            if(unifiedList.length === 0) return;

            const treeArt = '<img class="career-tree-art" src="assets/images/career-tree-organic.png" alt="" aria-hidden="true" loading="lazy" decoding="async">';
            container.innerHTML = treeArt + unifiedList.map(item => {
                const period = escapeHtml(readObjProp(item, 'Period'));
                const title = escapeHtml(readObjProp(item, 'Title') || readObjProp(item, 'Degree'));
                const center = escapeHtml(readObjProp(item, 'Company') || readObjProp(item, 'Institution'));
                const desc = escapeHtml(readObjProp(item, 'Description'));
                const icon = sanitizeIconClass(readObjProp(item, 'Icon'));

                return `
                    <div class="timeline-item timeline-${item.blockType}" data-timeline-type="${item.blockType}">
                        <div class="timeline-content">
                            <span class="timeline-period">${period}</span>
                            <div class="timeline-icon"><i class="fas ${icon || (item.blockType === 'edu' ? 'fa-graduation-cap' : 'fa-briefcase')}"></i></div>
                            <h3 class="text-base font-bold text-white">${title}</h3>
                            <span class="timeline-company text-xs">${center}</span>
                            <p class="timeline-description text-xs mt-2 leading-relaxed text-gray-400">${desc}</p>
                        </div>
                    </div>`;
            }).join('');
        }

