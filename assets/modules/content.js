function setPortfolioText(id, value) {
    const element = document.getElementById(id);
    if (element && String(value || '').trim()) element.textContent = String(value).trim();
}

function applyPortfolioContent(payload) {
    const profile = payload.profile || {};
    const config = payload.config || {};
    const configuredText = [
        ['aboutSectionTitle', 'about_section_title'],
        ['skillsSectionTitle', 'skills_section_title'],
        ['projectsSectionTitle', 'projects_section_title'],
        ['certificatesSectionTitle', 'certificates_section_title'],
        ['blogsSectionTitle', 'blogs_section_title'],
        ['experienceSectionTitle', 'experience_section_title'],
        ['faqSectionTitle', 'faq_section_title'],
        ['contactSectionTitle', 'contact_section_title'],
        ['chatbotName', 'chatbot_name'],
        ['chatbotWelcome', 'chatbot_welcome']
    ];
    configuredText.forEach(([id, key]) => setPortfolioText(id, readObjProp(config, key)));

    const resume = sanitizeUrl(readObjProp(profile, 'ResumeURL'));
    const resumeLink = document.getElementById('resumeLink');
    if (resumeLink && resume) {
        resumeLink.href = resume;
        resumeLink.classList.remove('hidden');
    }

    const footer = document.getElementById('portfolioFooter');
    if (footer) {
        const configured = readObjProp(config, 'footer_text');
        const name = readObjProp(profile, 'Name');
        footer.textContent = configured || [new Date().getFullYear(), name].filter(Boolean).join(' ');
    }

    if (typeof applySEOConfig === 'function') applySEOConfig(buildPortfolioSEO(profile, config, payload.skills || []));
}

function isSiteFeatureActive(features, key) {
    const feature = features && features[key];
    return !feature || feature.active !== false;
}

function applySiteFeatures(features) {
    const sectionMap = { hero: 'home', about: 'about', skills: 'skills', projects: 'projects', certificates: 'certificates', blog: 'blogs', faq: 'faq', contact: 'contact' };
    Object.entries(sectionMap).forEach(([key, id]) => {
        const element = document.getElementById(id);
        if (element) element.hidden = !isSiteFeatureActive(features, key);
    });
    const timelineActive = isSiteFeatureActive(features, 'experience') || isSiteFeatureActive(features, 'education');
    const timeline = document.getElementById('experience');
    if (timeline) timeline.hidden = !timelineActive;
    document.querySelectorAll('[data-feature-nav]').forEach(link => {
        const keys = String(link.dataset.featureNav || '').split(',');
        link.hidden = !keys.some(key => isSiteFeatureActive(features, key));
    });
    ['chatToggle', 'chatWindow'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.hidden = !isSiteFeatureActive(features, 'chatbot');
    });
    const resume = document.getElementById('resumeLink');
    if (resume && !isSiteFeatureActive(features, 'resume')) resume.classList.add('hidden');
    const socials = document.getElementById('socialContainer');
    if (socials) socials.hidden = !isSiteFeatureActive(features, 'social_links');
}

function renderFAQ(items) {
    const container = document.getElementById('faqContainer');
    const section = document.getElementById('faq');
    if (!container || !section) return;
    const rows = Array.isArray(items) ? items : [];
    section.hidden = rows.length === 0;
    container.innerHTML = rows.map(item => {
        const question = escapeHtml(readObjProp(item, 'Question'));
        const answer = escapeHtml(readObjProp(item, 'Answer'));
        const category = escapeHtml(readObjProp(item, 'Category'));
        return `<details class="glass rounded-2xl p-5 border border-white/5"><summary class="cursor-pointer font-semibold text-white">${question}</summary>${category ? `<div class="text-[10px] uppercase tracking-wider text-orange-400 mt-3">${category}</div>` : ''}<p class="text-sm text-gray-400 leading-relaxed mt-2">${answer}</p></details>`;
    }).join('');
}
