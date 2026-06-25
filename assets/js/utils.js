        function readObjProp(obj, targetKey) {
            if (!obj) return "";
            if (obj.hasOwnProperty(targetKey)) return obj[targetKey];
            const lowerTarget = targetKey.toLowerCase();
            for (let k in obj) {
                if (k.toLowerCase() === lowerTarget) return obj[k];
            }
            return "";
        }

        function escapeHtml(value) {
            return String(value || "").replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]);
        }

        function sanitizeUrl(value, options = {}) {
            const url = String(value || "").trim();
            if (!url || url === "#") return url === "#" ? "#" : "";

            if (options.allowImageData && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(url)) {
                return url;
            }

            try {
                const parsed = new URL(url, window.location.origin);
                const allowedProtocols = options.image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:'];
                return allowedProtocols.includes(parsed.protocol) ? parsed.href : "";
            } catch (error) {
                return "";
            }
        }

        function sanitizeHtml(value) {
            const allowedTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'SPAN', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'IMG', 'CODE', 'PRE']);
            const blockedTags = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'STYLE', 'LINK', 'META']);
            const template = document.createElement('template');
            template.innerHTML = String(value || "");

            const sanitizeInlineStyle = styleValue => {
                const style = String(styleValue || "");
                if (!style.trim()) return "";
                return style
                    .split(';')
                    .map(rule => rule.trim())
                    .filter(rule => {
                        if (!rule || !rule.includes(':')) return false;
                        return !/(expression\s*\(|javascript\s*:|vbscript\s*:|data\s*:|@import)/i.test(rule);
                    })
                    .join('; ');
            };

            const unwrapNode = node => {
                const fragment = document.createDocumentFragment();
                [...node.childNodes].forEach(child => fragment.appendChild(child));
                node.replaceWith(fragment);
            };

            const cleanNode = node => {
                if (node.nodeType === Node.COMMENT_NODE) {
                    node.remove();
                    return;
                }

                if (node.nodeType !== Node.ELEMENT_NODE) return;

                const tag = node.tagName;
                if (blockedTags.has(tag)) {
                    node.remove();
                    return;
                }

                if (!allowedTags.has(tag)) {
                    [...node.childNodes].forEach(cleanNode);
                    unwrapNode(node);
                    return;
                }

                [...node.attributes].forEach(attr => {
                    const name = attr.name.toLowerCase();
                    const value = attr.value || "";
                    if (name.startsWith('on') || name === 'srcdoc') {
                        node.removeAttribute(attr.name);
                        return;
                    }

                    if (name === 'style') {
                        const safeStyle = sanitizeInlineStyle(value);
                        if (safeStyle) {
                            node.setAttribute('style', safeStyle);
                        } else {
                            node.removeAttribute(attr.name);
                        }
                        return;
                    }

                    if (tag === 'A' && name === 'href') {
                        const safeHref = sanitizeUrl(value);
                        if (safeHref) {
                            node.setAttribute('href', safeHref);
                            node.setAttribute('target', '_blank');
                            node.setAttribute('rel', 'noopener noreferrer');
                        } else {
                            node.removeAttribute(attr.name);
                        }
                        return;
                    }

                    if (tag === 'IMG' && name === 'src') {
                        const safeSrc = sanitizeUrl(value, { image: true, allowImageData: true });
                        if (safeSrc) {
                            node.setAttribute('src', safeSrc);
                            node.setAttribute('loading', 'lazy');
                            node.setAttribute('decoding', 'async');
                        } else {
                            node.removeAttribute(attr.name);
                        }
                        return;
                    }

                    if (tag === 'IMG' && ['alt', 'title', 'width', 'height', 'loading', 'decoding'].includes(name)) {
                        if ((name === 'loading' && value !== 'lazy') || (name === 'decoding' && value !== 'async')) {
                            node.removeAttribute(attr.name);
                        }
                        return;
                    }

                    if (tag === 'A' && (name === 'target' || name === 'rel')) return;
                    node.removeAttribute(attr.name);
                });

                if (tag === 'IMG' && !node.getAttribute('src')) {
                    node.remove();
                    return;
                }

                [...node.childNodes].forEach(cleanNode);
            };

            [...template.content.childNodes].forEach(cleanNode);
            return template.innerHTML;
        }

        function renderMixedBlogContent(value) {
            const text = String(value || "").trim();
            if (!text) return "";

            if (/<[a-z][\s\S]*>/i.test(text)) {
                return sanitizeHtml(text);
            }

            return `<p>${escapeHtml(text)
                .replace(/\r\n/g, '\n')
                .replace(/\n{2,}/g, '</p><p>')
                .replace(/\n/g, '<br>')}</p>`;
        }

        function sanitizeIconClass(value) {
            return String(value || "")
                .split(/\s+/)
                .filter(cls => /^fa[srbld]?$/.test(cls) || /^fa-[a-z0-9-]+$/i.test(cls))
                .join(" ");
        }

        function sanitizePercent(value) {
            const number = Number(value);
            if (!Number.isFinite(number)) return 0;
            return Math.max(0, Math.min(100, number));
        }
