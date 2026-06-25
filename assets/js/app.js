        document.addEventListener('DOMContentLoaded', async function() {
            if(typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true });
            
            if(typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
                particlesJS('particles-js', {
                    particles: {
                        number: { value: 45, density: { enable: true, value_area: 800 } },
                        color: { value: "#FF6B35" },
                        shape: { type: "circle" },
                        opacity: { value: 0.35, random: true },
                        size: { value: 2.5, random: true },
                        line_linked: { enable: true, distance: 140, color: "#FF6B35", opacity: 0.2, width: 1 },
                        move: { enable: true, speed: 1.2, direction: "none", random: true, out_mode: "out" }
                    }
                });
            }

            await loadDataPipelineStream();
            replaceFontAwesomeIcons();
            initializeChatbotEngine();
            updatePortfolioLoader('ai');
            initializeMobileNavigation();
            initializeFormSubmission();
            completePortfolioLoader();
        });

        // কেস-ইনসেনসিティブ এবং সেফ ফলব্যাক প্রপার্টি রিডিং অবজেক্ট হেল্পার
