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
#pw *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}

/* Bubble */
#pw-bubble{
  position:fixed;bottom:28px;right:28px;z-index:99999;
  width:52px;height:52px;border-radius:50%;
  background:#0B2A6B;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(11,42,107,.45);
  transition:transform .18s,box-shadow .18s
}
#pw-bubble:hover{transform:scale(1.06);box-shadow:0 6px 22px rgba(11,42,107,.55)}
#pw-bubble svg{width:22px;height:22px;fill:#fff;transition:opacity .15s}
#pw-bubble .pw-x{display:none;font-size:20px;color:#fff;line-height:1;font-style:normal;font-weight:300}
#pw-bubble.open svg{display:none}
#pw-bubble.open .pw-x{display:block}
#pw-badge{
  position:absolute;top:-3px;right:-3px;
  background:#C8960C;color:#fff;
  font-size:10px;font-weight:700;
  min-width:17px;height:17px;border-radius:9px;
  display:none;align-items:center;justify-content:center;
  padding:0 4px;pointer-events:none;border:2px solid #fff
}

/* Panel */
#pw-panel{
  position:fixed;bottom:90px;right:28px;z-index:99998;
  width:360px;height:620px;
  background:#fff;border-radius:16px;
  box-shadow:0 12px 48px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);
  display:flex;flex-direction:column;overflow:hidden;
  opacity:0;pointer-events:none;
  transform:translateY(10px) scale(.97);
  transition:opacity .2s ease,transform .2s ease,width .25s ease,height .25s ease
}
#pw-panel.open{opacity:1;pointer-events:all;transform:translateY(0) scale(1)}
#pw-panel.max{
  width:min(640px,calc(100vw - 40px));
  height:min(720px,calc(100vh - 110px));
  bottom:20px;right:20px
}

/* Header */
#pw-hdr{
  background:#0B2A6B;
  padding:16px 16px 14px;
  display:flex;align-items:center;gap:12px;
  flex-shrink:0
}
#pw-hdr-text{flex:1;min-width:0}
#pw-hdr-title{color:#fff;font-size:.875rem;font-weight:600;letter-spacing:-.01em}
#pw-hdr-sub{
  color:rgba(255,255,255,.5);font-size:.72rem;
  margin-top:3px;display:flex;align-items:center;gap:6px
}
#pw-online-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0}
.pw-hdr-btn{
  background:transparent;border:none;
  width:28px;height:28px;border-radius:6px;
  cursor:pointer;color:rgba(255,255,255,.55);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:color .15s,background .15s
}
.pw-hdr-btn:hover{color:#fff;background:rgba(255,255,255,.1)}
.pw-hdr-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

/* Intake form */
#pw-form{
  flex:1;overflow-y:auto;
  padding:22px 20px 20px;
  display:flex;flex-direction:column;gap:0
}
#pw-form::-webkit-scrollbar{width:3px}
#pw-form::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:2px}
.pw-intro{
  font-size:.78rem;line-height:1.7;color:#555;
  padding:12px 14px;background:#F5F7FF;
  border-radius:8px;border-left:2px solid #0B2A6B;
  margin-bottom:22px
}
.pw-field{margin-bottom:18px}
.pw-label{
  display:block;font-size:.68rem;font-weight:700;
  color:#999;letter-spacing:.07em;text-transform:uppercase;
  margin-bottom:7px
}
.pw-label .pw-req{color:#c44}
.pw-input{
  width:100%;height:41px;
  border:1.5px solid #E8EBF2;border-radius:8px;
  padding:0 12px;font-size:.84rem;color:#1a1a1a;
  background:#FAFBFE;outline:none;
  transition:border-color .15s,background .15s
}
.pw-input:focus{border-color:#0B2A6B;background:#fff}
.pw-hint{font-size:.68rem;color:#bbb;margin-top:6px;line-height:1.5}
.pw-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px}
.pw-chip{
  padding:7px 16px;border-radius:6px;
  border:1.5px solid #E8EBF2;
  background:#FAFBFE;font-size:.77rem;
  color:#555;cursor:pointer;
  transition:all .14s;font-family:inherit;line-height:1.4
}
.pw-chip:hover{border-color:#0B2A6B;color:#0B2A6B}
.pw-chip.on{background:#0B2A6B;color:#fff;border-color:#0B2A6B}
.pw-textarea{
  width:100%;
  border:1.5px solid #E8EBF2;border-radius:8px;
  padding:10px 12px;font-size:.84rem;color:#1a1a1a;
  background:#FAFBFE;outline:none;resize:none;
  line-height:1.6;font-family:inherit;
  transition:border-color .15s,background .15s
}
.pw-textarea:focus{border-color:#0B2A6B;background:#fff}
#pw-err{
  font-size:.74rem;color:#b00;
  background:#FFF0F0;border-radius:6px;
  padding:8px 11px;margin-bottom:12px;display:none
}
#pw-submit{
  width:100%;height:44px;
  background:#0B2A6B;color:#fff;border:none;
  border-radius:8px;font-size:.85rem;font-weight:600;
  cursor:pointer;letter-spacing:.01em;
  transition:background .15s;margin-top:6px
}
#pw-submit:hover{background:#0f3d9e}
#pw-submit:disabled{background:#9aa;cursor:not-allowed}

/* Messages */
#pw-msgs{
  flex:1;overflow-y:auto;
  padding:16px 14px;
  display:flex;flex-direction:column;gap:4px;
  background:#F8F9FC
}
#pw-msgs::-webkit-scrollbar{width:3px}
#pw-msgs::-webkit-scrollbar-thumb{background:#dde;border-radius:2px}
.pw-msg-wrap{display:flex;flex-direction:column;max-width:86%}
.pw-msg-wrap.v{align-self:flex-end;align-items:flex-end}
.pw-msg-wrap.a{align-self:flex-start;align-items:flex-start}
.pw-msg-wrap.s{align-self:center;align-items:center;max-width:100%}
.pw-agent-lbl{font-size:.65rem;font-weight:600;color:#0B2A6B;margin-bottom:2px;padding-left:1px}
.pw-bubble{
  padding:9px 13px;border-radius:12px;
  font-size:.82rem;line-height:1.6;word-break:break-word
}
.pw-bubble.v{background:#0B2A6B;color:#fff;border-bottom-right-radius:3px}
.pw-bubble.a{background:#fff;color:#1a1a1a;border-bottom-left-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.pw-bubble.s{background:transparent;color:#aaa;font-size:.73rem;font-style:italic;padding:2px 0;box-shadow:none}
.pw-time{font-size:.63rem;color:#bbb;margin-top:3px}
.pw-msg-wrap.v .pw-time{text-align:right}

/* Timeout warning */
#pw-warn{
  background:#FFFBEA;border-top:1px solid #FDE68A;
  padding:8px 14px;display:none;
  align-items:center;gap:10px;flex-shrink:0
}
#pw-warn span{font-size:.74rem;color:#78350F;flex:1;line-height:1.4}
#pw-warn button{
  font-size:.72rem;font-weight:600;
  padding:4px 12px;border-radius:5px;
  background:#0B2A6B;color:#fff;border:none;cursor:pointer;
  flex-shrink:0
}

/* Footer */
#pw-foot{background:#fff;border-top:1px solid #EEF0F5;flex-shrink:0}
#pw-input-row{display:flex;align-items:flex-end;gap:8px;padding:10px 12px}
#pw-input{
  flex:1;border:1.5px solid #E8EBF2;border-radius:8px;
  padding:8px 11px;font-size:.82rem;
  resize:none;outline:none;line-height:1.5;
  font-family:inherit;max-height:80px;
  background:#FAFBFE;color:#1a1a1a;
  transition:border-color .15s,background .15s
}
#pw-input:focus{border-color:#0B2A6B;background:#fff}
#pw-send{
  width:34px;height:34px;flex-shrink:0;
  background:#0B2A6B;border:none;border-radius:8px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:background .14s
}
#pw-send:hover{background:#0f3d9e}
#pw-send:disabled{background:#c0c4d0;cursor:not-allowed}
#pw-send svg{width:14px;height:14px;fill:#fff}
#pw-hint-txt{font-size:.63rem;color:#ccc;padding:0 13px 6px;text-align:right}
#pw-end-bar{padding:0 13px 10px;text-align:right}
#pw-end-btn{background:none;border:none;font-size:.68rem;color:#bbb;cursor:pointer;padding:0;font-family:inherit;text-decoration:underline;text-underline-offset:2px;transition:color .14s}
#pw-end-btn:hover{color:#c00}
#pw-closed-note{padding:12px 14px;text-align:center;font-size:.76rem;color:#999;background:#F8F9FC}

@media(max-width:440px){
  #pw-panel{width:calc(100vw - 20px)!important;right:10px;bottom:76px}
  #pw-panel.max{width:calc(100vw - 12px)!important;height:calc(100vh - 86px)!important;bottom:6px;right:6px}
  #pw-bubble{bottom:18px;right:18px}
}
`;

  var el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);

  /* ─── HTML ───────────────────────────────────────────────── */
  var root = document.createElement('div');
  root.id = 'pw';
  root.innerHTML = `
<button id="pw-bubble" aria-label="Chat with us">
  <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
  <i class="pw-x">&#x2715;</i>
  <span id="pw-badge"></span>
</button>

<div id="pw-panel" role="dialog" aria-label="Live chat">

  <div id="pw-hdr">
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
    <p class="pw-intro">Please fill in your details before we start. In case we get disconnected, we will contact you immediately.</p>

    <div class="pw-field">
      <label class="pw-label">Full Name <span class="pw-req">*</span></label>
      <input class="pw-input" id="pw-name" placeholder="Juan dela Cruz" maxlength="80" autocomplete="name">
    </div>
    <div class="pw-field">
      <label class="pw-label">Email <span class="pw-req">*</span></label>
      <input class="pw-input" id="pw-email" type="email" placeholder="juan@email.com" maxlength="120" autocomplete="email">
    </div>
    <div class="pw-field">
      <label class="pw-label">Contact Number <span class="pw-req">*</span></label>
      <input class="pw-input" id="pw-phone" type="tel" placeholder="09XX XXX XXXX" maxlength="20" autocomplete="tel">
      <p class="pw-hint">We will call you if the chat is disconnected.</p>
    </div>
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
      <label class="pw-label">Concern <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#bbb;font-size:.68rem">(optional)</span></label>
      <textarea class="pw-textarea" id="pw-bg" rows="2" placeholder="Briefly describe your concern…" maxlength="400"></textarea>
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
        <svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
      </button>
    </div>
    <div id="pw-hint-txt">Enter to send &nbsp;&middot;&nbsp; Shift+Enter for new line</div>
    <div id="pw-end-bar"><button id="pw-end-btn">End chat</button></div>
    <div id="pw-closed-note" style="display:none">This chat session has been closed.</div>
  </div>
</div>`;
  document.body.appendChild(root);

  /* ─── Refs ───────────────────────────────────────────────── */
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
      await sendMsg('Enquiry type: '+label+(bg?'\n\n'+bg:''));
      await poll();
    } catch(e) {
      submitEl.disabled = false; submitEl.textContent = 'Start Chat';
      showErr(e.message && e.message.length < 200 ? e.message : 'Could not connect. Please try again.');
    }
  });

  /* ─── Panel open / close ─────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    bubble.classList.add('open');
    unread = 0; setBadge();
    msgs.scrollTop = msgs.scrollHeight;
    if (sessionId && !isClosed) startPoll();
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    bubble.classList.remove('open');
    stopPoll();
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
