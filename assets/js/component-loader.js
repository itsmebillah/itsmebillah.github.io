        async function loadHtmlComponents() {
            const placeholders = Array.from(document.querySelectorAll('[data-component]'));
            const componentResponses = await Promise.all(placeholders.map(async placeholder => {
                const componentPath = placeholder.getAttribute('data-component');
                const response = await fetch(componentPath);
                if (!response.ok) throw new Error(`Component load failed: ${componentPath}`);

                return {
                    placeholder,
                    html: await response.text()
                };
            }));

            componentResponses.forEach(({ placeholder, html }) => {
                const template = document.createElement('template');
                template.innerHTML = html;
                placeholder.replaceWith(template.content);
            });
        }

        async function initializeHtmlComponents() {
            try {
                await loadHtmlComponents();
                window.__portfolioComponentsLoaded = true;
                document.dispatchEvent(new Event('portfolio:components-loaded'));
            } catch (error) {
                console.error('Portfolio component load failure:', error);
                document.dispatchEvent(new CustomEvent('portfolio:components-error', { detail: error }));
            }
        }

        initializeHtmlComponents();
