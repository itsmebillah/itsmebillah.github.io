        const SEO_CONFIG = {
            language: 'en',
            title: 'Md Masum Billah | Data Analyst & Automation Developer Bangladesh',
            description: 'Portfolio of Md Masum Billah, a Data Analyst and Automation Developer in Bangladesh specializing in Power BI, SQL, Google Apps Script, Excel, business intelligence, and workflow automation.',
            keywords: 'Md Masum Billah, Data Analyst Bangladesh, Automation Developer, Power BI Developer, SQL Analyst, Google Apps Script Developer, Excel Automation, Business Intelligence',
            canonical: 'https://itsmebillah.github.io/',
            robots: 'index, follow',
            crawlerRobots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
            author: 'Md. Masum Billah',
            image: 'https://i.postimg.cc/26DtqzQr/1777886932477.jpg',
            imageAlt: 'Portrait of Md Masum Billah',
            imageType: 'image/jpeg',
            imageWidth: '1200',
            imageHeight: '630',
            og: {
                type: 'profile',
                locale: 'en_US',
                siteName: 'Md Masum Billah Portfolio'
            },
            twitter: {
                card: 'summary_large_image'
            },
            structuredData: {
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'Person',
                        '@id': 'https://itsmebillah.github.io/#person',
                        name: 'Md. Masum Billah',
                        alternateName: ['Masum Billah', 'itsmebillah'],
                        url: 'https://itsmebillah.github.io/',
                        image: 'https://i.postimg.cc/26DtqzQr/1777886932477.jpg',
                        jobTitle: 'Data Analyst | Automation Developer | Business Intelligence Specialist',
                        description: 'Data Analyst and Automation Developer specializing in data analysis, automation, business intelligence dashboards, and Google Apps Script solutions.',
                        email: 'mailto:itsmbillah@gmail.com',
                        telephone: '+8801915966721',
                        address: {
                            '@type': 'PostalAddress',
                            addressLocality: 'Dhaka',
                            addressCountry: 'BD'
                        },
                        sameAs: [
                            'https://github.com/itsmebillah',
                            'https://linkedin.com/in/itsmebillah',
                            'https://www.facebook.com/itsmebillah',
                            'https://wa.me/8801915966721'
                        ],
                        knowsAbout: [
                            'Data Analysis',
                            'Business Intelligence',
                            'Power BI',
                            'SQL',
                            'Google Apps Script',
                            'Excel',
                            'Python',
                            'Workflow Automation'
                        ]
                    },
                    {
                        '@type': 'Organization',
                        '@id': 'https://itsmebillah.github.io/#organization',
                        name: 'Md Masum Billah Portfolio',
                        url: 'https://itsmebillah.github.io/',
                        logo: 'https://i.postimg.cc/26DtqzQr/1777886932477.jpg',
                        founder: {
                            '@id': 'https://itsmebillah.github.io/#person'
                        },
                        sameAs: [
                            'https://github.com/itsmebillah',
                            'https://linkedin.com/in/itsmebillah',
                            'https://www.facebook.com/itsmebillah'
                        ]
                    },
                    {
                        '@type': 'WebSite',
                        '@id': 'https://itsmebillah.github.io/#website',
                        url: 'https://itsmebillah.github.io/',
                        name: 'Md Masum Billah Portfolio',
                        description: 'Portfolio of Md Masum Billah, a Data Analyst and Automation Developer in Bangladesh specializing in business intelligence and workflow automation.',
                        inLanguage: 'en',
                        publisher: {
                            '@id': 'https://itsmebillah.github.io/#organization'
                        },
                        author: {
                            '@id': 'https://itsmebillah.github.io/#person'
                        }
                    }
                ]
            }
        };

        function upsertMeta(selector, createAttrs, content) {
            if (!content) return;
            let node = document.head.querySelector(selector);
            if (!node) {
                node = document.createElement('meta');
                Object.keys(createAttrs).forEach(key => node.setAttribute(key, createAttrs[key]));
                document.head.appendChild(node);
            }
            node.setAttribute('content', content);
        }

        function upsertCanonical(url) {
            if (!url) return;
            let canonical = document.head.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', url);
        }

        function applySEOConfig(config = SEO_CONFIG) {
            if (!config) return;

            document.documentElement.lang = config.language || 'en';
            document.title = config.title || document.title;
            upsertCanonical(config.canonical);

            upsertMeta('meta[name="description"]', { name: 'description' }, config.description);
            upsertMeta('meta[name="keywords"]', { name: 'keywords' }, config.keywords);
            upsertMeta('meta[name="robots"]', { name: 'robots' }, config.robots);
            upsertMeta('meta[name="googlebot"]', { name: 'googlebot' }, config.crawlerRobots);
            upsertMeta('meta[name="bingbot"]', { name: 'bingbot' }, config.crawlerRobots);
            upsertMeta('meta[name="author"]', { name: 'author' }, config.author);
            upsertMeta('meta[name="language"]', { name: 'language' }, config.language === 'en' ? 'English' : config.language);
            upsertMeta('meta[name="application-name"]', { name: 'application-name' }, config.og && config.og.siteName);

            upsertMeta('meta[property="og:type"]', { property: 'og:type' }, config.og && config.og.type);
            upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, config.og && config.og.locale);
            upsertMeta('meta[property="og:title"]', { property: 'og:title' }, config.socialTitle || config.title);
            upsertMeta('meta[property="og:description"]', { property: 'og:description' }, config.socialDescription || config.description);
            upsertMeta('meta[property="og:url"]', { property: 'og:url' }, config.canonical);
            upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, config.og && config.og.siteName);
            upsertMeta('meta[property="og:image"]', { property: 'og:image' }, config.image);
            upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, config.image);
            upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type' }, config.imageType);
            upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, config.imageAlt);
            upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, config.imageWidth);
            upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, config.imageHeight);

            upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, config.twitter && config.twitter.card);
            upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, config.twitterTitle || config.socialTitle || config.title);
            upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, config.twitterDescription || config.socialDescription || config.description);
            upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, config.image);
            upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, config.imageAlt);

            const structuredData = document.getElementById('structured-data');
            if (structuredData && config.structuredData) {
                structuredData.textContent = JSON.stringify(config.structuredData, null, 2);
            }
        }

        function buildPortfolioSEO(profile, config, skills) {
            const value = (source, key) => String(readObjProp(source || {}, key) || '').trim();
            const name = value(profile, 'Name');
            const title = value(profile, 'Title');
            const bio = value(profile, 'Bio');
            const canonical = sanitizeUrl(value(config, 'canonical_url')) || SEO_CONFIG.canonical;
            const image = sanitizeUrl(value(config, 'og_image') || value(profile, 'ProfilePic'), { image: true }) || SEO_CONFIG.image;
            const siteName = value(config, 'site_name') || value(config, 'name') || (name ? `${name} Portfolio` : SEO_CONFIG.og.siteName);
            const pageTitle = value(config, 'site_title') || [name, title].filter(Boolean).join(' | ') || SEO_CONFIG.title;
            const description = value(config, 'meta_description') || bio || SEO_CONFIG.description;
            const socialLinks = ['GitHub', 'LinkedIn', 'Facebook', 'WhatsApp']
                .map(key => sanitizeUrl(value(profile, key)))
                .filter(Boolean);
            const skillNames = (Array.isArray(skills) ? skills : [])
                .map(skill => value(skill, 'Name'))
                .filter(Boolean)
                .slice(0, 30);
            const personId = `${canonical.replace(/#.*$/, '').replace(/\/$/, '')}/#person`;
            const organizationId = `${canonical.replace(/#.*$/, '').replace(/\/$/, '')}/#organization`;
            const websiteId = `${canonical.replace(/#.*$/, '').replace(/\/$/, '')}/#website`;
            return {
                language: value(config, 'language') || SEO_CONFIG.language,
                title: pageTitle,
                description,
                keywords: value(config, 'meta_keywords') || skillNames.join(', '),
                canonical,
                robots: SEO_CONFIG.robots,
                crawlerRobots: SEO_CONFIG.crawlerRobots,
                author: name,
                image,
                imageAlt: name ? `Portrait of ${name}` : 'Portfolio image',
                imageType: SEO_CONFIG.imageType,
                imageWidth: SEO_CONFIG.imageWidth,
                imageHeight: SEO_CONFIG.imageHeight,
                og: { type: 'profile', locale: SEO_CONFIG.og.locale, siteName },
                twitter: { card: SEO_CONFIG.twitter.card },
                socialTitle: value(config, 'og_title') || pageTitle,
                socialDescription: value(config, 'og_description') || description,
                twitterTitle: value(config, 'twitter_title') || value(config, 'og_title') || pageTitle,
                twitterDescription: value(config, 'twitter_description') || value(config, 'og_description') || description,
                structuredData: {
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'Person', '@id': personId, name, url: canonical, image,
                            jobTitle: title, description: bio,
                            email: value(profile, 'Email') ? `mailto:${value(profile, 'Email')}` : undefined,
                            telephone: value(profile, 'Phone') || undefined,
                            address: value(profile, 'Location') ? { '@type': 'PostalAddress', addressLocality: value(profile, 'Location') } : undefined,
                            sameAs: socialLinks, knowsAbout: skillNames
                        },
                        {
                            '@type': 'Organization', '@id': organizationId, name: siteName,
                            url: canonical, logo: image, founder: { '@id': personId }, sameAs: socialLinks
                        },
                        {
                            '@type': 'WebSite', '@id': websiteId, url: canonical, name: siteName,
                            description, inLanguage: value(config, 'language') || SEO_CONFIG.language,
                            publisher: { '@id': organizationId }, author: { '@id': personId }
                        }
                    ]
                }
            };
        }

        window.SEO_CONFIG = SEO_CONFIG;
        window.applySEOConfig = applySEOConfig;
        window.buildPortfolioSEO = buildPortfolioSEO;
