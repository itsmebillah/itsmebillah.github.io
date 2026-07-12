        async function loadDataPipelineStream() {
            try {
                const response = await fetch(`${GAS_API_URL}?action=getAllData`);
                if (!response.ok) throw new Error(`Portfolio API request failed with status ${response.status}`);
                updatePortfolioLoader('apps');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                updatePortfolioLoader('sheets');
                
                if (result) {
                    const payload = result.data || result;
                    
                    if (payload.profile || payload.skills || payload.projects) {
                        renderProfile(payload.profile);
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
                    }
                }
            } catch (error) {
                console.error('Data pipeline stream sync failure:', error);
            }
        }
