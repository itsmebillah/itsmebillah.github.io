        const SEO_CONFIG = {
            language: 'en',
            title: 'Md Masum Billah | Data Analyst & Automation Developer Bangladesh',
            description: 'Md Masum Billah is a Data Analyst and Automation Developer in Bangladesh, specializing in Power BI, SQL, Google Apps Script, Excel, and workflow automation.',
            keywords: 'Md Masum Billah, Data Analyst Bangladesh, Automation Developer, Power BI Developer, SQL Analyst, Google Apps Script Developer, Excel Automation, Business Intelligence',
            canonical: 'https://itsmebillah.github.io/',
            robots: 'index, follow',
            author: 'Md. Masum Billah',
            image: 'https://i.postimg.cc/26DtqzQr/1777886932477.jpg',
            imageAlt: 'Portrait of Md Masum Billah',
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
                        description: 'Portfolio of Md Masum Billah, a Data Analyst and Automation Developer in Bangladesh.',
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
            upsertMeta('meta[name="author"]', { name: 'author' }, config.author);
            upsertMeta('meta[name="language"]', { name: 'language' }, config.language === 'en' ? 'English' : config.language);

            upsertMeta('meta[property="og:type"]', { property: 'og:type' }, config.og && config.og.type);
            upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, config.og && config.og.locale);
            upsertMeta('meta[property="og:title"]', { property: 'og:title' }, config.title);
            upsertMeta('meta[property="og:description"]', { property: 'og:description' }, config.description);
            upsertMeta('meta[property="og:url"]', { property: 'og:url' }, config.canonical);
            upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, config.og && config.og.siteName);
            upsertMeta('meta[property="og:image"]', { property: 'og:image' }, config.image);
            upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, config.imageAlt);

            upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, config.twitter && config.twitter.card);
            upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, config.title);
            upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, config.description);
            upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, config.image);
            upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, config.imageAlt);

            const structuredData = document.getElementById('structured-data');
            if (structuredData && config.structuredData) {
                structuredData.textContent = JSON.stringify(config.structuredData, null, 2);
            }
        }

        window.SEO_CONFIG = SEO_CONFIG;
        window.applySEOConfig = applySEOConfig;
