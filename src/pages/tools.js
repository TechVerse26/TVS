/**
 * Tools Directory Page
 * Tech Verse-এর সব টুলস ও প্রোজেক্টের ক্যাটালগ
 */
export async function renderTools() {
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="page-hero small-hero">
      <div class="container">
        <div class="hero-badge"><i class="fa-solid fa-screwdriver-wrench icon-accent"></i> Tech Verse ইকোসিস্টেম</div>
        <h1>টুলস ডিরেক্টরি</h1>
        <p>Tech Verse-এর সকল প্রজেক্ট ও টুলস এক জায়গায়।</p>
      </div>
    </div>

    <div class="container tools-layout">

      <!-- Category Filter -->
      <div class="filter-bar" id="tool-filter">
        ${TOOL_CATS.map((c, i) => `
          <button class="filter-btn ${i === 0 ? 'active' : ''}"
            data-cat="${c.slug}" onclick="ToolsPage.filter('${c.slug}')">
            ${c.icon} ${c.name}
          </button>`).join('')}
      </div>

      <!-- Tools Grid -->
      <div class="tools-grid" id="tools-grid">
        ${TOOLS.map(t => _toolCard(t)).join('')}
      </div>
    </div>
  `;

  window.ToolsPage = {
    filter(cat) {
      document.querySelectorAll('#tool-filter .filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.cat === cat));
      const grid    = document.getElementById('tools-grid');
      const filtered = cat === 'all' ? TOOLS : TOOLS.filter(t => t.cat === cat);
      grid.innerHTML = filtered.length
        ? filtered.map(t => _toolCard(t)).join('')
        : '<p class="empty-state">এই ক্যাটাগরিতে কোনো টুল নেই।</p>';
    }
  };
}

function _toolCard(tool) {
  return `
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-icon icon-box icon-box-lg">${tool.icon}</div>
        <div class="tool-badges">
          ${tool.new   ? '<span class="badge badge-new">নতুন</span>'   : ''}
          ${tool.beta  ? '<span class="badge badge-beta">Beta</span>'  : ''}
          ${tool.free  ? '<span class="badge badge-free">বিনামূল্যে</span>' : ''}
        </div>
      </div>
      <h3 class="tool-name">${tool.name}</h3>
      <p class="tool-desc">${tool.desc}</p>
      <div class="tool-tags">
        ${tool.tags.map(t => `<span class="tag-sm">${t}</span>`).join('')}
      </div>
      <div class="tool-actions">
        <a href="${tool.url}" class="btn btn-primary" target="${tool.external ? '_blank' : '_self'}" rel="noopener">
          ${tool.external ? 'ভিজিট করুন <i class="fa-solid fa-arrow-up-right-from-square"></i>' : 'খুলুন <i class="fa-solid fa-arrow-right"></i>'}
        </a>
        ${tool.github ? `
          <a href="${tool.github}" class="btn btn-ghost" target="_blank" rel="noopener" aria-label="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
                0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466
                -.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832
                .092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688
                -.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844
                c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651
                .64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855
                0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017
                C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>` : ''}
      </div>
    </div>`;
}

const TOOL_CATS = [
  { slug: 'all',      name: 'সব',        icon: '<i class="fa-solid fa-globe"></i>' },
  { slug: 'edu',      name: 'শিক্ষা',    icon: '<i class="fa-solid fa-book-open"></i>' },
  { slug: 'ecom',     name: 'ই-কমার্স',  icon: '<i class="fa-solid fa-cart-shopping"></i>' },
  { slug: 'ngo',      name: 'NGO',       icon: '<i class="fa-solid fa-handshake"></i>' },
  { slug: 'utility',  name: 'ইউটিলিটি', icon: '<i class="fa-solid fa-gear"></i>' },
];

// Add / update your own Tech Verse projects here
const TOOLS = [
  {
    name: 'Tech Verse Learn', icon: '<i class="fa-solid fa-book-open"></i>', cat: 'edu', free: true, new: false, beta: false,
    desc: 'বাংলায় প্রযুক্তি শিক্ষার সবচেয়ে বড় প্ল্যাটফর্ম। ভিডিও কোর্স, আর্টিকেল ও প্রজেক্ট।',
    tags: ['শিক্ষা', 'কোর্স', 'বাংলা'], url: '/learn', external: false, github: '',
  },
  {
    name: 'Tech Verse Blog', icon: '<i class="fa-solid fa-pen"></i>', cat: 'edu', free: true, new: false, beta: false,
    desc: 'আধুনিক প্রযুক্তির টিউটোরিয়াল, গাইড ও সর্বশেষ খবর।',
    tags: ['ব্লগ', 'টিউটোরিয়াল'], url: '/blog', external: false, github: '',
  },
  {
    name: 'Vive Shop', icon: '<i class="fa-solid fa-cart-shopping"></i>', cat: 'ecom', free: false, new: false, beta: false,
    desc: 'বাংলাদেশের স্মার্ট বাংলা ই-কমার্স প্ল্যাটফর্ম — Firebase ও Firestore চালিত।',
    tags: ['e-commerce', 'firebase', 'বাংলা'], url: 'https://viveshop.vercel.app', external: true, github: '',
  },
  {
    name: 'Rupsha NGO', icon: '<i class="fa-solid fa-handshake"></i>', cat: 'ngo', free: true, new: false, beta: false,
    desc: 'রূপসা জনকল্যাণ ফাউন্ডেশনের অফিসিয়াল ওয়েবসাইট।',
    tags: ['ngo', 'community'], url: 'https://rupsha.org', external: true, github: '',
  },
  {
    name: 'Imran Portfolio', icon: '<i class="fa-solid fa-user"></i>', cat: 'utility', free: true, new: false, beta: false,
    desc: 'দ্বিভাষিক (বাংলা/ইংরেজি) ব্যক্তিগত পোর্টফোলিও সাইট।',
    tags: ['portfolio', 'bilingual'], url: 'https://imran.vercel.app', external: true, github: '',
  },
  {
    name: 'Al-Quran PWA', icon: '<i class="fa-solid fa-book-open"></i>', cat: 'edu', free: true, new: true, beta: false,
    desc: 'সম্পূর্ণ আল-কুরআন — বাংলা অনুবাদ ও তিলাওয়াত সহ, অফলাইন PWA।',
    tags: ['quran', 'pwa', 'অফলাইন'], url: 'https://quranresource.vercel.app', external: true, github: '',
  },
];
