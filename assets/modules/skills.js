        function renderSkills(skills) {
            const container = document.getElementById('skillsContainer');
            if (!container || !skills || skills.length === 0) return;
            
            const sorted = skills.sort((a, b) => (Number(readObjProp(a, 'Order')) || 99) - (Number(readObjProp(b, 'Order')) || 99));
            const mid = Math.ceil(sorted.length / 2);
            const left = sorted.slice(0, mid);
            const right = sorted.slice(mid);

            const mapSkill = s => {
                const name = escapeHtml(readObjProp(s, 'Name'));
                const level = sanitizePercent(readObjProp(s, 'Level') || 0);
                const cat = escapeHtml(readObjProp(s, 'Category'));
                return `
                    <div class="skill-container">
                        <div class="skill-header">
                            <span class="skill-name">${name}</span>
                            <span class="skill-percentage">${level}%</span>
                        </div>
                        <div class="skill-bar"><div class="skill-progress" style="width: ${level}%"></div></div>
                        <div class="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">${cat}</div>
                    </div>`;
            };
            container.innerHTML = `<div>${left.map(mapSkill).join('')}</div><div>${right.map(mapSkill).join('')}</div>`;
        }

