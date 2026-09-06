/**
 * SEO Component
 * Dynamic meta tags, Open Graph, Twitter Card, structured data
 */
export const SEO = {

  /**
   * পেজের meta tags সেট করো
   * @param {Object} opts
   */
  set({ title, description, image, url, type = 'website', author, datePublished, tags = [] }) {
    const siteName = 'Tech Verse';
    const fullTitle = title ? `${title} — ${siteName}` : siteName;
    const desc = description || 'শিক্ষা, প্রযুক্তি এবং উদ্ভাবনের স্মার্ট প্ল্যাটফর্ম।';
    const canonical = url || window.location.href;
    const img = image || '/public/og-default.png';

    // Title
    document.title = fullTitle;

    // Helper: meta tag সেট বা তৈরি করো
    const setMeta = (selector, attr, val, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard
    setMeta('meta[name="description"]',       'name', 'description',       desc);
    setMeta('meta[name="keywords"]',          'name', 'keywords',          tags.join(', '));
    setMeta('meta[name="author"]',            'name', 'author',            author || siteName);
    setMeta('meta[name="robots"]',            'name', 'robots',            'index, follow');

    // Open Graph
    setMeta('meta[property="og:title"]',       'property', 'og:title',       fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:image"]',       'property', 'og:image',       img);
    setMeta('meta[property="og:url"]',         'property', 'og:url',         canonical);
    setMeta('meta[property="og:type"]',        'property', 'og:type',        type);
    setMeta('meta[property="og:site_name"]',   'property', 'og:site_name',   siteName);
    setMeta('meta[property="og:locale"]',      'property', 'og:locale',      'bn_BD');

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'name', 'twitter:card',        'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'name', 'twitter:title',       fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    setMeta('meta[name="twitter:image"]',       'name', 'twitter:image',       img);

    // Canonical URL
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;

    // Article structured data
    if (type === 'article' && datePublished) {
      this._setArticleSchema({ title: fullTitle, description: desc, image: img,
        url: canonical, author, datePublished, tags });
    } else {
      this._removeSchema('article');
    }
  },

  /** পোস্টের জন্য shortcut */
  setPost(post) {
    this.set({
      title        : post.title,
      description  : post.excerpt,
      image        : post.cover,
      url          : `${window.location.origin}/blog/${post.id}`,
      type         : 'article',
      author       : post.author || 'Tech Verse',
      datePublished: post.createdAt?.toDate?.()?.toISOString(),
      tags         : post.tags || [],
    });
  },

  /** কোর্সের জন্য shortcut */
  setCourse(course) {
    this.set({
      title      : course.title,
      description: `${course.title} — ${course.lessons || '—'} লেসন, ${course.duration || '—'}`,
      url        : `${window.location.origin}/course/${course.id}`,
      type       : 'website',
      tags       : course.tags || [],
    });
  },

  /** হোম পেজ রিসেট */
  reset() {
    this.set({
      title      : null,
      description: null,
    });
  },

  _setArticleSchema({ title, description, image, url, author, datePublished, tags }) {
    this._removeSchema('article');
    const script = document.createElement('script');
    script.type        = 'application/ld+json';
    script.dataset.schema = 'article';
    script.textContent = JSON.stringify({
      '@context'      : 'https://schema.org',
      '@type'         : 'Article',
      'headline'      : title,
      'description'   : description,
      'image'         : image,
      'url'           : url,
      'datePublished' : datePublished,
      'author'        : { '@type': 'Person', 'name': author || 'Tech Verse' },
      'publisher'     : {
        '@type': 'Organization',
        'name' : 'Tech Verse',
        'logo' : { '@type': 'ImageObject', 'url': `${window.location.origin}/public/favicon.svg` }
      },
      'keywords': tags.join(', '),
    });
    document.head.appendChild(script);
  },

  _removeSchema(type) {
    document.querySelector(`script[data-schema="${type}"]`)?.remove();
  },
};
