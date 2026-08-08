        async function loadDataPipelineStream() {
            const cacheKey = 'portfolio_public_dto_v1';
            const applyPayload = payload => {
                if (!payload || (!payload.profile && !payload.skills && !payload.projects)) {
                    throw new Error('Portfolio API returned an incompatible payload.');
                }
                window.portfolioData = payload;
                renderProfile(payload.profile);
                applyPortfolioContent(payload);
                updatePortfolioLoader('profile');
                renderSkills(payload.skills);
                updatePortfolioLoader('skills');
                renderProjects(payload.projects);
                updatePortfolioLoader('projects');
                renderCertificates(payload.certificates);
                updatePortfolioLoader('certificates');
                renderBlogs(payload.blogs);
                updatePortfolioLoader('blogs');
                renderTimeline(payload.experience, payload.education);
                updatePortfolioLoader('timeline');
                renderFAQ(payload.faq);
            };
            const readLastKnownGood = () => {
                try {
                    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
                    return cached && cached.schemaVersion === 1 && cached.data ? cached : null;
                } catch (error) {
                    return null;
                }
            };
            const showUnavailableState = () => {
                const projects = document.getElementById('otherProjectsContainer') || document.getElementById('featuredProjectsContainer');
                if (projects && !projects.children.length) {
                    projects.innerHTML = '<p class="text-sm text-gray-400">Project data is temporarily unavailable. Please try again later.</p>';
                }
            };

            try {
                const requestParams = new URLSearchParams({
                    action: 'getAllData',
                    clientId: getPortfolioClientId()
                });
                const response = await fetch(`${GAS_API_URL}?${requestParams.toString()}`);
                if (!response.ok) throw new Error(`Portfolio API request failed with status ${response.status}`);
                updatePortfolioLoader('apps');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                if (!result || result.success !== true || !result.data ||
                    (result.schemaVersion !== undefined && result.schemaVersion !== 1)) {
                    throw new Error('Portfolio API returned an invalid response.');
                }
                updatePortfolioLoader('sheets');
                applyPayload(result.data);
                if (result.schemaVersion === 1) {
                    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (error) {}
                }
            } catch (error) {
                console.error('Data pipeline stream sync failure:', error);
                const cached = readLastKnownGood();
                if (cached) {
                    applyPayload(cached.data);
                    updatePortfolioLoader('apps');
                    updatePortfolioLoader('sheets');
                } else {
                    showUnavailableState();
                }
            }
        }
