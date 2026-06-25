        function iconSvg(iconClass, className = '') {
            const icon = localIconPaths[iconClass] || localIconPaths['fa-briefcase'];
            return `<svg class="${className} fa-icon" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false"><path d="${icon.path}"></path></svg>`;
        }

        function replaceFontAwesomeIcons(root = document) {
            root.querySelectorAll('i[class*="fa-"]').forEach(icon => {
                const iconClass = [...icon.classList].find(cls => localIconPaths[cls]);
                if (!iconClass) return;
                const wrapper = document.createElement('template');
                wrapper.innerHTML = iconSvg(iconClass, icon.className);
                icon.replaceWith(wrapper.content.firstElementChild);
            });
        }

        function updatePortfolioLoader(taskName) {
            if (taskName) portfolioLoaderTasks.add(taskName);
            const loader = document.getElementById('loader');
            if (!loader) return;

            const progress = Math.min(portfolioLoaderTasks.size / portfolioLoaderTaskList.length, 1);
            const plugTravel = Math.min(Math.max(window.innerWidth * 0.12, 48), 92);
            const plugShift = Math.round(progress * plugTravel);
            const cableShift = Math.round(plugShift * 0.42);
            loader.style.setProperty('--loader-progress', progress.toFixed(3));
            loader.style.setProperty('--loader-percent', `${Math.round(progress * 100)}%`);
            loader.style.setProperty('--plug-shift', `${plugShift}px`);
            loader.style.setProperty('--plug-shift-neg', `${plugShift * -1}px`);
            loader.style.setProperty('--cable-shift', `${cableShift}px`);
            loader.style.setProperty('--cable-shift-neg', `${cableShift * -1}px`);
            const percentText = document.getElementById('loaderPercent');
            if (percentText) percentText.textContent = `${Math.round(progress * 100)}%`;

            const stepState = {
                sheets: portfolioLoaderTasks.has('sheets'),
                apps: portfolioLoaderTasks.has('apps'),
                ai: portfolioLoaderTasks.has('ai'),
                portfolio: ['profile', 'skills', 'projects', 'certificates', 'blogs', 'timeline'].every(task => portfolioLoaderTasks.has(task))
            };

            Object.keys(stepState).forEach(step => {
                const item = document.querySelector(`[data-loader-step="${step}"]`);
                if (item) item.classList.toggle('done', stepState[step]);
            });
        }

        function completePortfolioLoader() {
            const loader = document.getElementById('loader');
            if (!loader) return;

            portfolioLoaderTaskList.forEach(task => portfolioLoaderTasks.add(task));
            updatePortfolioLoader();
            loader.classList.add('loader-online');
            loader.setAttribute('aria-busy', 'false');
            const title = document.getElementById('loaderTitle');
            const subtitle = document.getElementById('loaderSubtitle');
            if (subtitle) subtitle.textContent = 'Systems connected. Launching portfolio.';
            if (title) title.textContent = '⚡ Portfolio Online';

            setTimeout(() => {
                loader.style.opacity = '0';
                document.body.classList.remove('portfolio-loading');
                setTimeout(() => loader.style.display = 'none', 500);
            }, 700);
        }


        function initializeMobileNavigation() {
            const toggle = document.getElementById('mobileNavToggle');
            const panel = document.getElementById('mobileNavPanel');
            const links = document.querySelectorAll('.mobile-nav-link');
            if (!toggle || !panel) return;

            const closeMenu = () => {
                toggle.classList.remove('open');
                panel.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Open navigation menu');
            };

            const openMenu = () => {
                toggle.classList.add('open');
                panel.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
                toggle.setAttribute('aria-label', 'Close navigation menu');
            };

            toggle.addEventListener('click', (event) => {
                event.stopPropagation();
                panel.classList.contains('open') ? closeMenu() : openMenu();
            });

            links.forEach(link => link.addEventListener('click', closeMenu));
            document.addEventListener('click', (event) => {
                if (!panel.classList.contains('open')) return;
                if (panel.contains(event.target) || toggle.contains(event.target)) return;
                closeMenu();
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') closeMenu();
            });
        }

