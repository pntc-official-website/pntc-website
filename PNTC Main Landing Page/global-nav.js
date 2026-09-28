(function () {
  'use strict';
  var script = document.currentScript;
  var AREA = (script && script.getAttribute('data-area')) || '';
  var ITEMS = [
    { id: 'training',    label: 'Training Center',       href: '/training/' },
    { id: 'college',     label: 'College',               href: '/college/' },
    { id: 'shs',         label: 'Senior High School',    href: '/shs/' },
    { id: 'philnautical',label: 'PNSC',                  href: '/philnautical' },
    { id: 'about',       label: 'About PNTC',            href: '/about' },
    { id: 'careers',     label: 'Careers',               href: '/careers' }
  ];
  var H = 38;

  var css = [
    ':root{--gnav-h:' + H + 'px}',
    'body{padding-top:var(--gnav-h)!important}',
    '#nav,#header{top:var(--gnav-h)!important}',
    'nav.nav{top:var(--gnav-h)!important}',
    '@media(max-width:768px){nav.nav .nav-links{top:calc(60px + var(--gnav-h))!important}}',
    '#pntc-gnav{position:fixed;top:0;left:0;right:0;height:var(--gnav-h);z-index:1000;background:#050a15;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;padding:0 clamp(1rem,4vw,3rem);font-family:Montserrat,system-ui,sans-serif}',
    '#pntc-gnav .gn-list{display:flex;align-items:center;gap:clamp(1rem,2.2vw,2rem);overflow-x:auto;scrollbar-width:none;white-space:nowrap;height:100%;margin:0 auto 0 0;padding:0;list-style:none}',
    '#pntc-gnav .gn-list::-webkit-scrollbar{display:none}',
    '#pntc-gnav a{position:relative;display:flex;align-items:center;height:100%;font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);text-decoration:none;transition:color .2s}',
    '#pntc-gnav a:hover{color:#fff}',
    '#pntc-gnav a.active{color:#E6AF1A}',
    '#pntc-gnav a.active::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:#C8960C}',
    '#pntc-gnav a.gn-brand{margin-right:clamp(1rem,2.5vw,2.5rem);flex-shrink:0;opacity:.9}',
    '#pntc-gnav a.gn-brand:hover{opacity:1}',
    '#pntc-gnav a.gn-brand::after{display:none}',
    '#pntc-gnav .gn-brand img{height:22px;width:auto;display:block}',
    '#mob-menu{z-index:1100!important}',
    /* Area navbar: one format everywhere (College style) */
    '.hdr-nav a,#nav .nav-links a,nav.nav .nav-links a{font-family:"Barlow Condensed",sans-serif!important;font-size:.85rem!important;font-weight:700!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:rgba(255,255,255,.6)!important;transition:color .2s}',
    '.hdr-nav a:hover,#nav .nav-links a:hover,nav.nav .nav-links a:hover,.hdr-nav a.is-current,#nav .nav-links a.is-current,nav.nav .nav-links a.is-current{color:#C8960C!important}',
    '.hdr-nav a::after,#nav .nav-links a::after,nav.nav .nav-links a::after{display:none!important}',
    '.hdr-apply,.hdr-enroll,#nav .nav-cta,nav.nav .nav-enroll-btn{padding:.52rem 1.4rem!important;background:#C8960C!important;color:#060c19!important;font-family:"Barlow Condensed",sans-serif!important;font-weight:800!important;font-size:.85rem!important;letter-spacing:.1em!important;text-transform:uppercase!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);transition:background .2s}',
    '.hdr-apply:hover,.hdr-enroll:hover,#nav .nav-cta:hover,nav.nav .nav-enroll-btn:hover{background:#E6AF1A!important}',
    '#nav .nav-login{padding:.5rem 1.2rem!important;border:1.5px solid rgba(255,255,255,.3)!important;border-radius:0!important;color:rgba(255,255,255,.75)!important;font-family:"Barlow Condensed",sans-serif!important;font-weight:700!important;font-size:.85rem!important;letter-spacing:.1em!important;text-transform:uppercase!important}',
    '#nav .nav-login:hover{border-color:#C8960C!important;color:#C8960C!important}',
    '.pntc-area{display:flex;flex-direction:column;justify-content:center;min-width:0;flex-shrink:1;margin-right:1.5rem;text-decoration:none}',
    '.pntc-area .pa-top{font:700 .58rem/1 Montserrat,system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--pa-accent,#C8960C);margin-bottom:.4rem}',
    '.pntc-area .pa-name{font:800 1rem/1.15 Montserrat,system-ui,sans-serif;letter-spacing:.03em;text-transform:uppercase;color:#fff}',
    '@media(min-width:721px){.pntc-area{flex-shrink:0}.pntc-area .pa-name{white-space:nowrap}}',
    '@media(max-width:720px){.pntc-area .pa-name{font-size:.8rem}.pntc-area .pa-top{font-size:.5rem;margin-bottom:.3rem}}',
    '@media(max-width:720px){#pntc-gnav .gn-brand img{height:18px}#pntc-gnav .gn-list{-webkit-mask-image:linear-gradient(90deg,#000 82%,transparent);mask-image:linear-gradient(90deg,#000 82%,transparent);padding-right:2rem}}'
  ].join('');

  if (!document.querySelector('link[href*="Barlow+Condensed"]')) {
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&display=swap';
    document.head.appendChild(font);
  }

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement('nav');
  bar.id = 'pntc-gnav';
  bar.setAttribute('aria-label', 'PNTC network');
  bar.innerHTML = '<a class="gn-brand' + (AREA === 'home' ? ' active' : '') + '" href="/" aria-label="PNTC home"><img src="/SHS/PNTC%20White%20Horizontal.png" alt="PNTC"></a><ul class="gn-list">' + ITEMS.map(function (it) {
    return '<li><a href="' + it.href + '"' + (it.id === AREA ? ' class="active" aria-current="page"' : '') + '>' +
      it.label.replace('&', '&amp;') + '</a></li>';
  }).join('') + '</ul>';

  function mount() { document.body.insertBefore(bar, document.body.firstChild); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
