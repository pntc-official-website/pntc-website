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
    '@media(max-width:720px){#pntc-gnav .gn-brand img{height:18px}#pntc-gnav .gn-list{-webkit-mask-image:linear-gradient(90deg,#000 82%,transparent);mask-image:linear-gradient(90deg,#000 82%,transparent);padding-right:2rem}}'
  ].join('');

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
