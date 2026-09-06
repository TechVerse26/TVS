/**
 * Sitemap Generator
 * /sitemap.xml রুট handle করে dynamic sitemap তৈরি করে
 * Vercel Edge Function বা Static হিসেবে দুইভাবে কাজ করে
 */

/**
 * Static sitemap — deploy করার আগে একবার রান করো
 * অথবা Vercel serverless function হিসেবে ব্যবহার করো
 */
export async function generateSitemap() {
  const base  = 'https://techverse.vercel.app'; // ← তোমার domain বসাও
  const today = new Date().toISOString().split('T')[0];

  // Static routes
  const staticUrls = [
    { loc: '/',      priority: '1.0', changefreq: 'daily'   },
    { loc: '/blog',  priority: '0.9', changefreq: 'daily'   },
    { loc: '/learn', priority: '0.9', changefreq: 'weekly'  },
    { loc: '/tools', priority: '0.8', changefreq: 'weekly'  },
    { loc: '/auth',  priority: '0.5', changefreq: 'monthly' },
  ];

  // Dynamic routes (Firestore থেকে)
  let dynamicUrls = [];
  try {
    const { collection, getDocs, query, orderBy } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const [postsSnap, coursesSnap] = await Promise.all([
      getDocs(query(collection(window.__firebase.db, 'posts'), orderBy('createdAt','desc'))),
      getDocs(query(collection(window.__firebase.db, 'courses'))),
    ]);

    postsSnap.docs.forEach(d => {
      const updated = d.data().updatedAt?.toDate?.()?.toISOString()?.split('T')[0] || today;
      dynamicUrls.push({ loc: `/blog/${d.id}`, priority: '0.8', changefreq: 'weekly', lastmod: updated });
    });

    coursesSnap.docs.forEach(d => {
      dynamicUrls.push({ loc: `/course/${d.id}`, priority: '0.7', changefreq: 'monthly', lastmod: today });
    });
  } catch { /* Firebase config না থাকলে শুধু static */ }

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Client-side sitemap download (Admin Dashboard-এ ব্যবহার করো)
 */
export async function downloadSitemap() {
  window.Toast.show('Sitemap তৈরি হচ্ছে...', 'info');
  const xml  = await generateSitemap();
  const blob = new Blob([xml], { type: 'application/xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'sitemap.xml';
  a.click();
  URL.revokeObjectURL(url);
  window.Toast.show('sitemap.xml ডাউনলোড হয়েছে!', 'success');
}

window.downloadSitemap = downloadSitemap;
