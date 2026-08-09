        function renderSkills(skills) {
            const container = document.getElementById('skillsContainer');
            if (!container || !skills || skills.length === 0) return;
            
            const sorted = skills.sort((a, b) => (Number(readObjProp(a, 'Order')) || 99) - (Number(readObjProp(b, 'Order')) || 99));
            const mid = Math.ceil(sorted.length / 2);
            const left = sorted.slice(0, mid);
            const right = sorted.slice(mid);

            const iconForSkill = name => {
                const value = String(name || '').toLowerCase();
                if (value.includes('script') || value.includes('automation')) return 'fas fa-robot';
                if (value.includes('power bi') || value.includes('analysis') || value.includes('sql')) return 'fas fa-chart-line';
                if (value.includes('python')) return 'fas fa-graduation-cap';
                return 'fas fa-briefcase';
            };

            const mapSkill = s => {
                const name = escapeHtml(readObjProp(s, 'Name'));
                const level = sanitizePercent(readObjProp(s, 'Level') || 0);
                const cat = escapeHtml(readObjProp(s, 'Category'));
                const activeSegments = Math.round(level / 10);
                const segments = Array.from({ length: 10 }, (_, index) => `<i class="${index < activeSegments ? 'active' : ''}"></i>`).join('');
                return `
                    <div class="skill-container">
                        <div class="skill-icon" aria-hidden="true"><i class="${iconForSkill(name)}"></i></div>
                        <div class="skill-header">
                            <span class="skill-name">${name}</span>
                            <span class="skill-percentage">${level}%</span>
                        </div>
                        <div class="skill-bar"><div class="skill-progress" style="width: ${level}%"></div></div>
                        <div class="skill-segments" aria-hidden="true">${segments}</div>
                        <div class="skill-category text-[11px] text-gray-500 mt-1 uppercase tracking-wider">${cat}</div>
                    </div>`;
            };
            container.innerHTML = `<div class="skill-column">${left.map(mapSkill).join('')}</div><div class="skill-column">${right.map(mapSkill).join('')}</div>`;
        }

