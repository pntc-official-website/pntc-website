(function () {
  'use strict';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var API  = '/api/chat';
  var SITE_LABELS = { colleges:'PNTC Colleges', shs:'PNTC Senior High School', maritime:'Maritime Training Center', aman:'Aman Sinaya', main:'PNTC' };
  var LABEL = SITE_LABELS[SITE] || 'PNTC';

  var TIMEOUT_MS = 20 * 60 * 1000;
  var WARNING_MS = 18 * 60 * 1000;

  var sessionId    = null;
  var isOpen       = false;
  var isMaximized  = false;
  var isClosed     = false;
  var knownIds     = {};
  var unread       = 0;
  var pollTimer    = null;
  var timeoutTimer = null;
  var warnTimer    = null;
  var lastActivity = Date.now();

  try { sessionId = sessionStorage.getItem('pntc_chat_' + SITE); } catch (e) {}

  /* ─── CSS ─────────────────────────────────────────────────── */
  var css = `
#pw{all:initial}
#pw *{box-sizing:border-box;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
:where(#pw *){margin:0;padding:0}
#pw{--n:#1C1650;--n2:#2B2275;--g:#F3CF33;--soft:#F5F6FB;--line:rgba(28,22,80,.12);--txt:rgba(28,22,80,.72)}
#pw.pw-shs{--n:#181D71;--n2:#262C96;--g:#FFCC00}

/* "agent is online" pill */
#pw-agent-label{position:fixed;bottom:40px;right:104px;z-index:99999;background:#fff;border-radius:999px;padding:11px 18px 11px 14px;box-shadow:0 14px 34px -14px rgba(28,22,80,.5);display:flex;align-items:center;gap:9px;font-size:.8rem;font-weight:700;color:var(--n);white-space:nowrap;cursor:pointer;border:1px solid var(--line);opacity:0;pointer-events:none;transform:translateX(12px);transition:opacity .3s ease,transform .3s ease}
#pw-agent-label.show{opacity:1;pointer-events:all;transform:translateX(0)}
#pw-agent-label::after{content:'';position:absolute;right:-6px;top:50%;width:12px;height:12px;margin-top:-6px;background:#fff;border-right:1px solid var(--line);border-top:1px solid var(--line);transform:rotate(45deg)}
#pw-al-dot{width:9px;height:9px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:pw-pulse 2.2s ease-in-out infinite}
@keyframes pw-pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}60%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}

/* launcher */
#pw-bubble{position:fixed;bottom:26px;right:26px;z-index:99999;width:62px;height:62px;border-radius:50%;background:linear-gradient(140deg,var(--n2),var(--n));border:3px solid var(--g);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 34px -12px rgba(28,22,80,.7);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
#pw-bubble::before{content:'';position:absolute;inset:-9px;border-radius:50%;border:2px solid var(--g);opacity:0;animation:pw-ring 2.8s ease-out infinite}
#pw-bubble.open::before{animation:none}
@keyframes pw-ring{0%{transform:scale(.86);opacity:.7}70%,100%{transform:scale(1.25);opacity:0}}
#pw-bubble:hover{transform:scale(1.08) rotate(-6deg);box-shadow:0 22px 40px -12px rgba(28,22,80,.8)}
#pw-bubble svg{width:26px;height:26px;fill:var(--g);transition:transform .3s,opacity .2s}
#pw-bubble .pw-x{position:absolute;font-size:22px;color:var(--g);line-height:1;font-style:normal;font-weight:400;opacity:0;transform:rotate(-90deg) scale(.5);transition:transform .3s,opacity .2s}
#pw-bubble.open svg{opacity:0;transform:rotate(90deg) scale(.5)}
#pw-bubble.open .pw-x{opacity:1;transform:none}
#pw-badge{position:absolute;top:-6px;right:-6px;background:#E5484D;color:#fff;font-size:10px;font-weight:800;min-width:20px;height:20px;border-radius:10px;display:none;align-items:center;justify-content:center;padding:0 5px;pointer-events:none;border:2px solid #fff}

/* panel */
#pw-panel{position:fixed;bottom:104px;right:26px;z-index:99998;width:392px;height:min(680px,calc(100vh - 128px));background:#fff;border-radius:26px;box-shadow:0 40px 80px -30px rgba(16,11,51,.55),0 0 0 1px rgba(28,22,80,.06);display:flex;flex-direction:column;overflow:hidden;opacity:0;pointer-events:none;transform:translateY(18px) scale(.94);transform-origin:100% 100%;transition:opacity .25s ease,transform .35s cubic-bezier(.34,1.4,.64,1),width .25s ease,height .25s ease}
#pw-panel.open{opacity:1;pointer-events:all;transform:none}
#pw-panel.max{width:min(660px,calc(100vw - 40px));height:calc(100vh - 128px)}

/* header */
#pw-hdr{background:linear-gradient(135deg,var(--n) 0%,var(--n2) 100%);padding:20px 16px 34px 20px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:relative;overflow:hidden}
#pw-hdr::before{content:'';position:absolute;right:-50px;top:-70px;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,var(--g),transparent 68%);opacity:.32}
#pw-hdr::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:18px;background:#fff;border-radius:22px 22px 0 0}
#pw-avatar{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:3px solid var(--g);position:relative;z-index:1;overflow:hidden}
#pw-avatar img{width:74%;height:74%;object-fit:contain}
#pw-avatar svg{width:24px;height:24px;fill:none;stroke:var(--n);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#pw-hdr-text{flex:1;min-width:0;position:relative;z-index:1}
#pw-hdr-title{color:#fff;font-size:1rem;font-weight:800;letter-spacing:-.01em;line-height:1.25}
#pw-hdr-sub{color:rgba(255,255,255,.82);font-size:.74rem;font-weight:600;margin-top:5px;display:flex;align-items:center;gap:7px}
#pw-online-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;flex-shrink:0;animation:pw-pulse 2.2s ease-in-out infinite}
#pw .pw-hdr-btn{background:rgba(255,255,255,.12);border:none;width:32px;height:32px;border-radius:10px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;transition:background .15s,color .15s}
#pw .pw-hdr-btn:hover{background:var(--g);color:var(--n)}
#pw .pw-hdr-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}

/* intake form */
#pw-form{flex:1;overflow-y:auto;padding:4px 20px 20px;display:flex;flex-direction:column;gap:16px;background:#fff}
#pw-form::-webkit-scrollbar,#pw-msgs::-webkit-scrollbar{width:5px}
#pw-form::-webkit-scrollbar-thumb,#pw-msgs::-webkit-scrollbar-thumb{background:rgba(28,22,80,.18);border-radius:5px}
#pw .pw-hello{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;color:var(--n);line-height:1.2}
#pw .pw-hello span{background:linear-gradient(transparent 62%,var(--g) 62%,var(--g) 92%,transparent 92%)}
#pw .pw-intro{font-size:.82rem;line-height:1.65;color:var(--txt);margin-top:-8px}
#pw .pw-section{display:flex;flex-direction:column;gap:12px}
#pw .pw-field{display:block}
#pw .pw-label{display:block;font-size:.68rem;font-weight:800;color:var(--n);letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}
#pw .pw-label .pw-req{color:#E5484D}
#pw .pw-opt{font-weight:600;text-transform:none;letter-spacing:0;color:rgba(28,22,80,.5);font-size:.7rem}
#pw .pw-input,#pw .pw-textarea{width:100%;border:1.5px solid var(--line);border-radius:14px;font-size:.9rem;font-weight:500;color:var(--n);background:var(--soft);outline:none;transition:border-color .18s,box-shadow .18s,background .18s}
#pw .pw-input{height:48px;padding:0 16px}
#pw .pw-textarea{padding:13px 16px;resize:none;line-height:1.55}
#pw .pw-input::placeholder,#pw .pw-textarea::placeholder{color:rgba(28,22,80,.4);font-weight:500}
#pw .pw-input:focus,#pw .pw-textarea:focus{border-color:var(--n);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--g) 45%,transparent)}
#pw .pw-hint{font-size:.72rem;color:rgba(28,22,80,.55);margin-top:6px;line-height:1.5}
#pw .pw-chips{display:flex;flex-wrap:wrap;gap:7px}
#pw .pw-chip{padding:9px 15px;border-radius:999px;border:1.5px solid var(--line);background:#fff;font-size:.8rem;color:var(--n);cursor:pointer;font-weight:700;transition:transform .2s cubic-bezier(.34,1.56,.64,1),background .15s,color .15s,border-color .15s}
#pw .pw-chip:hover{border-color:var(--n);transform:translateY(-2px)}
#pw .pw-chip.on{background:var(--n);color:var(--g);border-color:var(--n);box-shadow:0 10px 18px -10px rgba(28,22,80,.7)}
#pw-err{font-size:.78rem;font-weight:600;color:#B4232A;background:#FDECEC;border-radius:12px;border:1px solid #F5C2C4;padding:10px 14px;display:none;line-height:1.5}
#pw-submit{width:100%;height:52px;background:var(--g);color:var(--n);border:none;border-radius:999px;font-size:.88rem;font-weight:800;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 14px 26px -12px color-mix(in srgb,var(--g) 80%,#000);transition:transform .2s,box-shadow .2s,background .2s,color .2s;flex-shrink:0}
#pw-submit:hover{transform:translateY(-2px);background:var(--n);color:var(--g);box-shadow:0 16px 28px -12px rgba(28,22,80,.7)}
#pw-submit:disabled{background:#D9DBE6;color:#8589A3;cursor:not-allowed;transform:none;box-shadow:none}

/* messages */
#pw-msgs{flex:1;overflow-y:auto;padding:8px 16px 16px;display:flex;flex-direction:column;gap:6px;background:#fff}
#pw .pw-msg-wrap{display:flex;flex-direction:column;max-width:84%;animation:pw-in .3s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pw-in{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
#pw .pw-msg-wrap.v{align-self:flex-end;align-items:flex-end}
#pw .pw-msg-wrap.a{align-self:flex-start;align-items:flex-start}
#pw .pw-msg-wrap.s{align-self:center;align-items:center;max-width:100%}
#pw .pw-agent-lbl{font-size:.68rem;font-weight:800;color:var(--n);margin:4px 0 3px 4px}
#pw .pw-bubble{padding:11px 15px;border-radius:18px;font-size:.88rem;line-height:1.55;word-break:break-word}
#pw .pw-bubble.v{background:var(--n);color:#fff;border-bottom-right-radius:6px}
#pw .pw-bubble.a{background:var(--soft);color:var(--n);border-bottom-left-radius:6px;border:1px solid rgba(28,22,80,.07)}
#pw .pw-bubble.s{background:color-mix(in srgb,var(--g) 35%,#fff);color:var(--n);font-size:.72rem;font-weight:700;padding:5px 12px;border-radius:999px;margin:6px 0}
#pw .pw-time{font-size:.64rem;color:rgba(28,22,80,.45);margin:3px 4px 0}

/* timeout warning */
#pw-warn{background:#FFF7DB;border-top:1px solid #F3DD8A;padding:9px 16px;display:none;align-items:center;gap:10px;flex-shrink:0}
#pw-warn span{font-size:.76rem;font-weight:600;color:#6B4E00;flex:1;line-height:1.4}
#pw-warn button{font-size:.72rem;font-weight:800;padding:7px 13px;border-radius:999px;background:var(--n);color:#fff;border:none;cursor:pointer;flex-shrink:0}

/* message box */
#pw-foot{background:#fff;border-top:1px solid var(--line);flex-shrink:0}
#pw-input-row{display:flex;align-items:flex-end;gap:8px;padding:12px 14px 8px}
#pw-input{flex:1;border:1.5px solid var(--line);border-radius:22px;padding:11px 16px;font-size:.88rem;resize:none;outline:none;line-height:1.45;max-height:90px;background:var(--soft);color:var(--n);transition:border-color .15s,background .15s,box-shadow .15s}
#pw-input:focus{border-color:var(--n);background:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--g) 45%,transparent)}
#pw-send{width:44px;height:44px;flex-shrink:0;background:var(--g);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s cubic-bezier(.34,1.56,.64,1),background .15s}
#pw-send:hover{transform:scale(1.1) rotate(-8deg)}
#pw-send:disabled{background:#D9DBE6;cursor:not-allowed;transform:none}
#pw-send svg{width:18px;height:18px;fill:none;stroke:var(--n);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
#pw-hint-txt{font-size:.64rem;color:rgba(28,22,80,.4);padding:0 18px 4px;text-align:left}
#pw-end-bar{padding:0 18px 12px;text-align:right;margin-top:-18px}
#pw-end-btn{background:none;border:none;font-size:.7rem;font-weight:700;color:rgba(28,22,80,.55);cursor:pointer;text-decoration:underline;text-underline-offset:3px;transition:color .14s}
#pw-end-btn:hover{color:#B4232A}
#pw-closed-note{padding:14px 16px;text-align:center;font-size:.8rem;font-weight:600;color:var(--txt);background:var(--soft)}

@media(max-width:480px){
  #pw-panel,#pw-panel.max{width:auto!important;left:8px;right:8px;bottom:92px;height:calc(100dvh - 104px)!important;border-radius:22px}
  #pw-bubble{bottom:16px;right:16px;width:58px;height:58px}
  #pw-agent-label{bottom:28px;right:88px}
}
@media(prefers-reduced-motion:reduce){#pw-bubble::before,#pw-al-dot,#pw-online-dot{animation:none}#pw .pw-msg-wrap{animation:none}#pw-panel{transition:opacity .2s}}
`;

  if (!document.querySelector('link[href*="Montserrat"]')) { var pf = document.createElement('link'); pf.id = 'pw-font'; pf.rel = 'stylesheet'; pf.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap'; document.head.appendChild(pf); }
  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);

  /* ─── HTML ───────────────────────────────────────────────── */
  var root = document.createElement('div');
  root.id = 'pw';
  if (SITE === 'shs') root.className = 'pw-shs';
  root.innerHTML = `
<div id="pw-agent-label">
  <span id="pw-al-dot"></span>
  <span><span id="pw-al-name">Agent</span> is online</span>
</div>
<button id="pw-bubble" aria-label="Chat with us">
  <svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.8 2 11.500c0 2.3 1.1 4.4 2.9 5.900L4 21.500l4.6-2.200c1.1.300 2.2.500 3.4.500 5.5 0 10-3.8 10-8.300S17.5 3 12 3z"/></svg>
  <i class="pw-x">&#x2715;</i>
  <span id="pw-badge"></span>
</button>

<div id="pw-panel" role="dialog" aria-label="Live chat">

  <div id="pw-hdr">
    <div id="pw-avatar">
      <img src="/PNTC%20Crest.png" alt="" onerror="this.outerHTML='<svg viewBox=&quot;0 0 24 24&quot;><path d=&quot;M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2&quot;/><circle cx=&quot;12&quot; cy=&quot;7&quot; r=&quot;4&quot;/></svg>'">
    </div>
    <div id="pw-hdr-text">
      <div id="pw-hdr-title">${LABEL} Support</div>
      <div id="pw-hdr-sub">
        <span id="pw-online-dot"></span>
        <span>We are online</span>
      </div>
    </div>
    <button class="pw-hdr-btn" id="pw-max-btn" aria-label="Expand">
      <svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    </button>
    <button class="pw-hdr-btn" id="pw-close-hdr" aria-label="Close">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <!-- Intake form -->
  <div id="pw-form">
    <p class="pw-hello">How can we <span>help you</span> today?</p>
    <p class="pw-intro">Please fill in your details before we start. In case we get disconnected, we will contact you immediately.</p>

    <div class="pw-section">
      <div class="pw-field">
        <label class="pw-label" for="pw-name">Full Name <span class="pw-req">*</span></label>
        <input class="pw-input" id="pw-name" placeholder="Juan dela Cruz" maxlength="80" autocomplete="name">
      </div>
      <div class="pw-field">
        <label class="pw-label" for="pw-email">Email <span class="pw-req">*</span></label>
        <input class="pw-input" id="pw-email" type="email" placeholder="juan@email.com" maxlength="120" autocomplete="email">
      </div>
      <div class="pw-field">
        <label class="pw-label" for="pw-phone">Contact Number <span class="pw-req">*</span></label>
        <input class="pw-input" id="pw-phone" type="tel" placeholder="09XX XXX XXXX" maxlength="20" autocomplete="tel">
        <p class="pw-hint">We will call you if the chat is disconnected.</p>
      </div>
    </div>

    <div class="pw-section">
      <div class="pw-field">
        <label class="pw-label">Enquiry Type <span class="pw-req">*</span></label>
        <div class="pw-chips" id="pw-chips">
          <button class="pw-chip" data-v="admission">Admission</button>
          <button class="pw-chip" data-v="registrar">Registrar</button>
          <button class="pw-chip" data-v="finance">Finance</button>
          <button class="pw-chip" data-v="academics">Academics</button>
          <button class="pw-chip" data-v="other">Other</button>
        </div>
      </div>
      <div class="pw-field">
        <label class="pw-label" for="pw-bg">Concern <span class="pw-opt">(optional)</span></label>
        <textarea class="pw-textarea" id="pw-bg" rows="3" placeholder="Briefly describe your concern…" maxlength="400"></textarea>
      </div>
    </div>

    <div id="pw-err"></div>
    <button id="pw-submit">Start Chat</button>
  </div>

  <!-- Chat area -->
  <div id="pw-msgs" style="display:none"></div>

  <!-- Timeout warning -->
  <div id="pw-warn">
    <span>No activity for 18 minutes. This chat will close in 2 minutes.</span>
    <button id="pw-keep">Keep open</button>
  </div>

  <!-- Footer -->
  <div id="pw-foot" style="display:none">
    <div id="pw-input-row">
      <textarea id="pw-input" placeholder="Type a message…" rows="1" maxlength="1000"></textarea>
      <button id="pw-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/></svg>
      </button>
    </div>
    <div id="pw-hint-txt">Enter to send &nbsp;&middot;&nbsp; Shift+Enter for new line</div>
    <div id="pw-end-bar"><button id="pw-end-btn">End chat</button></div>
    <div id="pw-closed-note" style="display:none">This chat session has been closed.</div>
  </div>
</div>`;
  document.body.appendChild(root);

  /* ─── Refs ───────────────────────────────────────────────── */
  var agentLabel     = document.getElementById('pw-agent-label');
  var agentLabelName = document.getElementById('pw-al-name');
  var bubble   = document.getElementById('pw-bubble');
  var panel    = document.getElementById('pw-panel');
  var maxBtn   = document.getElementById('pw-max-btn');
  var closeHdr = document.getElementById('pw-close-hdr');
  var form     = document.getElementById('pw-form');
  var nameEl   = document.getElementById('pw-name');
  var emailEl  = document.getElementById('pw-email');
  var phoneEl  = document.getElementById('pw-phone');
  var bgEl     = document.getElementById('pw-bg');
  var errEl    = document.getElementById('pw-err');
  var submitEl = document.getElementById('pw-submit');
  var chips    = document.querySelectorAll('#pw-chips .pw-chip');
  var msgs     = document.getElementById('pw-msgs');
  var warnBar  = document.getElementById('pw-warn');
  var keepBtn  = document.getElementById('pw-keep');
  var foot     = document.getElementById('pw-foot');
  var inputEl  = document.getElementById('pw-input');
  var sendEl   = document.getElementById('pw-send');
  var closedNote = document.getElementById('pw-closed-note');
  var endBar   = document.getElementById('pw-end-bar');
  var endBtn   = document.getElementById('pw-end-btn');
  var badge    = document.getElementById('pw-badge');

  var chosen = null;

  /* ─── Chips ──────────────────────────────────────────────── */
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
      chosen = c.dataset.v;
    });
  });

  /* ─── Maximize ───────────────────────────────────────────── */
  var maxSvgOut = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  var maxSvgIn  = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>';
  maxBtn.addEventListener('click', function () {
    isMaximized = !isMaximized;
    panel.classList.toggle('max', isMaximized);
    maxBtn.innerHTML = isMaximized ? maxSvgIn : maxSvgOut;
    msgs.scrollTop = msgs.scrollHeight;
  });
  closeHdr.addEventListener('click', function () { closePanel(); });

  /* ─── Helpers ────────────────────────────────────────────── */
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  }
  function esc(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }
  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  function setBadge() {
    if (unread > 0 && !isOpen) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }

  /* ─── Render message ─────────────────────────────────────── */
  function renderMsg(m) {
    if (knownIds[m.id]) return;
    knownIds[m.id] = true;

    if (m.sender === 'system') {
      var s = document.createElement('div');
      s.className = 'pw-msg-wrap s';
      s.innerHTML = '<div class="pw-bubble s">' + esc(m.message) + '</div>';
      msgs.appendChild(s);
      msgs.scrollTop = msgs.scrollHeight;
      return;
    }

    var wrap = document.createElement('div');
    wrap.className = 'pw-msg-wrap ' + (m.sender === 'visitor' ? 'v' : 'a');

    if (m.sender === 'agent' && m.agent_name) {
      var lbl = document.createElement('div');
      lbl.className = 'pw-agent-lbl';
      lbl.textContent = m.agent_name;
      wrap.appendChild(lbl);
    }

    var bub = document.createElement('div');
    bub.className = 'pw-bubble ' + (m.sender === 'visitor' ? 'v' : 'a');
    bub.innerHTML = esc(m.message);
    wrap.appendChild(bub);

    var t = document.createElement('div');
    t.className = 'pw-time';
    t.textContent = fmtTime(m.created_at);
    wrap.appendChild(t);

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;

    if (!isOpen && m.sender === 'agent') { unread++; setBadge(); }
  }

  /* ─── Timeout ────────────────────────────────────────────── */
  function resetActivity() {
    lastActivity = Date.now();
    warnBar.style.display = 'none';
    clearTimeout(warnTimer);
    clearTimeout(timeoutTimer);
    if (sessionId && !isClosed) armTimeout();
  }
  function armTimeout() {
    warnTimer    = setTimeout(function () { warnBar.style.display = 'flex'; }, WARNING_MS);
    timeoutTimer = setTimeout(autoClose, TIMEOUT_MS);
  }
  async function autoClose() {
    if (!sessionId || isClosed) return;
    isClosed = true;
    stopPoll();
    warnBar.style.display = 'none';
    renderMsg({ id:'sys_to', sender:'system', message:'Chat closed after 20 minutes of inactivity.', created_at:new Date().toISOString() });
    showClosed();
    try { await fetch(API+'/session/'+sessionId+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'closed'})}); } catch(e){}
    try { sessionStorage.removeItem('pntc_chat_'+SITE); } catch(e){}
  }
  keepBtn.addEventListener('click', resetActivity);

  /* ─── API ────────────────────────────────────────────────── */
  async function createSession(f) {
    var r = await fetch(API+'/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site:SITE,visitorName:f.name,visitorEmail:f.email,visitorContact:f.phone,concernType:f.concern,concernBackground:f.bg})});
    var d = await r.json();
    if (!d.sessionId) throw new Error(d.error || 'Session creation failed');
    sessionId = d.sessionId;
    try { sessionStorage.setItem('pntc_chat_'+SITE, sessionId); } catch(e){}
  }
  async function sendMsg(text) {
    if (!sessionId) return;
    await fetch(API+'/session/'+sessionId+'/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});
  }
  async function poll() {
    if (!sessionId) return;
    try {
      var r = await fetch(API+'/session/'+sessionId+'/messages');
      var d = await r.json();
      if (Array.isArray(d)) d.forEach(renderMsg);
    } catch(e){}
  }
  function startPoll() { if (pollTimer) return; poll(); pollTimer = setInterval(poll, 3000); }
  function stopPoll()  { clearInterval(pollTimer); pollTimer = null; }

  /* ─── UI states ──────────────────────────────────────────── */
  function showChatUI(name) {
    form.style.display = 'none';
    msgs.style.display = 'flex';
    msgs.style.flexDirection = 'column';
    foot.style.display = 'block';
    inputEl.disabled   = false;
    sendEl.disabled    = false;
    closedNote.style.display = 'none';
    renderMsg({id:'__greet__',sender:'agent',message:'Hello '+name+'! Thank you for reaching out. An agent will be with you shortly.',created_at:new Date().toISOString()});
    inputEl.focus();
    startPoll();
    resetActivity();
  }
  function showClosed() {
    inputEl.disabled = true;
    sendEl.disabled  = true;
    document.getElementById('pw-hint-txt').style.display = 'none';
    endBar.style.display   = 'none';
    closedNote.style.display = 'block';
  }

  endBtn.addEventListener('click', async function () {
    if (!sessionId || isClosed) return;
    if (!confirm('Are you sure you want to end this chat?')) return;
    isClosed = true;
    stopPoll();
    clearTimeout(warnTimer);
    clearTimeout(timeoutTimer);
    warnBar.style.display = 'none';
    renderMsg({ id:'sys_end', sender:'system', message:'You have ended this chat session.', created_at:new Date().toISOString() });
    showClosed();
    try { await fetch(API+'/session/'+sessionId+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'closed'})}); } catch(e){}
    try { sessionStorage.removeItem('pntc_chat_'+SITE); } catch(e){}
  });

  /* ─── Intake submit ──────────────────────────────────────── */
  submitEl.addEventListener('click', async function () {
    var name  = nameEl.value.trim();
    var email = emailEl.value.trim();
    var phone = phoneEl.value.trim();
    var bg    = bgEl.value.trim();
    errEl.style.display = 'none';
    if (!name)    { showErr('Please enter your full name.'); nameEl.focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('Please enter a valid email address.'); emailEl.focus(); return; }
    if (!phone)   { showErr('Please enter your contact number.'); phoneEl.focus(); return; }
    if (!chosen)  { showErr('Please select an enquiry type.'); return; }
    submitEl.disabled = true; submitEl.textContent = 'Starting…';
    try {
      await createSession({name,email,phone,concern:chosen,bg});
      showChatUI(name);
      var label = {admission:'Admission',registrar:'Registrar',finance:'Finance',academics:'Academics',other:'General Enquiry'}[chosen]||chosen;
      await sendMsg('Inquiry about '+label+(bg?'\n\n'+bg:''));
      await poll();
    } catch(e) {
      submitEl.disabled = false; submitEl.textContent = 'Start Chat';
      showErr(e.message && e.message.length < 200 ? e.message : 'Could not connect. Please try again.');
    }
  });

  /* ─── Agent online label ─────────────────────────────────── */
  function checkAgentOnline() {
    fetch(API + '/agent-status')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.online && d.agentName && !isOpen) {
          agentLabelName.textContent = d.agentName;
          agentLabel.classList.add('show');
        } else {
          agentLabel.classList.remove('show');
        }
      })
      .catch(function () {});
  }
  agentLabel.addEventListener('click', function () { if (!isOpen) openPanel(); });
  checkAgentOnline();
  setInterval(checkAgentOnline, 90000);

  /* ─── Panel open / close ─────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    bubble.classList.add('open');
    agentLabel.classList.remove('show');
    unread = 0; setBadge();
    msgs.scrollTop = msgs.scrollHeight;
    if (sessionId && !isClosed) startPoll();
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    bubble.classList.remove('open');
    stopPoll();
    checkAgentOnline();
  }
  bubble.addEventListener('click', function () { if (isOpen) closePanel(); else openPanel(); });

  /* ─── Send ───────────────────────────────────────────────── */
  async function doSend() {
    var text = inputEl.value.trim();
    if (!text || !sessionId || isClosed) return;
    inputEl.value = ''; inputEl.style.height = 'auto';
    resetActivity();
    renderMsg({id:'opt_'+Date.now(),sender:'visitor',message:text,created_at:new Date().toISOString()});
    msgs.scrollTop = msgs.scrollHeight;
    await sendMsg(text);
    await poll();
  }
  sendEl.addEventListener('click', doSend);
  inputEl.addEventListener('keydown', function (e) { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();} });
  inputEl.addEventListener('input', function () { this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,80)+'px'; });

  /* ─── Restore session ────────────────────────────────────── */
  if (sessionId) { showChatUI('there'); }
})();
