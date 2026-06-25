        async function loadDataPipelineStream() {
            try {
                console.log("Fetching live pipeline architecture...");
                const response = await fetch(`${GAS_API_URL}?action=getAllData`);
                updatePortfolioLoader('apps');
                const result = await response.json();
                updatePortfolioLoader('sheets');
                console.log("Pipeline payload extracted:", result);
                
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

