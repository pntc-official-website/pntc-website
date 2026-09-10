(function () {
  'use strict';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var API = '/api/chat';
  var SITE_LABELS = { colleges: 'PNTC Colleges', shs: 'PNTC Senior High School', maritime: 'Maritime Training Center', aman: 'Aman Sinaya', main: 'PNTC' };
  var LABEL = SITE_LABELS[SITE] || 'PNTC';

  var TIMEOUT_MS   = 20 * 60 * 1000; // 20 minutes
  var WARNING_MS   = 18 * 60 * 1000; // warn at 18 minutes

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

  // ── Styles ────────────────────────────────────────────────────
  var css = `
#pntc-chat-widget *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
#pntc-chat-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#0B2A6B;box-shadow:0 4px 20px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;border:none;transition:transform .2s,box-shadow .2s}
#pntc-chat-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.45)}
#pntc-chat-bubble svg.chat-icon{width:26px;height:26px;fill:#fff}
#pntc-chat-bubble .close-x{display:none;font-size:22px;color:#fff;line-height:1;font-style:normal}
#pntc-chat-bubble.open .chat-icon{display:none}
#pntc-chat-bubble.open .close-x{display:block}
#pntc-chat-unread{position:absolute;top:-4px;right:-4px;background:#C8960C;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px;pointer-events:none}

/* ── Panel ── */
#pntc-chat-panel{
  position:fixed;bottom:92px;right:24px;z-index:99998;
  width:350px;height:580px;
  border-radius:14px;background:#fff;
  box-shadow:0 8px 40px rgba(0,0,0,.24);
  display:flex;flex-direction:column;overflow:hidden;
  transform:scale(.9) translateY(12px);opacity:0;pointer-events:none;
  transition:transform .22s ease,opacity .22s ease,width .22s ease,height .22s ease,bottom .22s ease,right .22s ease,border-radius .22s ease
}
#pntc-chat-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
#pntc-chat-panel.maximized{
  width:min(680px,calc(100vw - 32px));
  height:min(740px,calc(100vh - 100px));
  bottom:16px;right:16px;border-radius:16px
}

/* ── Header ── */
#pntc-chat-header{background:linear-gradient(135deg,#0B2A6B 0%,#183A8F 100%);padding:13px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0}
#pntc-header-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
#pntc-chat-header-info{flex:1;min-width:0}
#pntc-chat-header-title{color:#fff;font-size:.88rem;font-weight:700}
#pntc-chat-header-sub{color:rgba(255,255,255,.55);font-size:.7rem;margin-top:1px;display:flex;align-items:center;gap:5px}
#pntc-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block}
.pntc-hdr-btn{background:rgba(255,255,255,.12);border:none;border-radius:7px;width:30px;height:30px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-size:13px}
.pntc-hdr-btn:hover{background:rgba(255,255,255,.25)}

/* ── Intake form ── */
#pntc-intake-form{padding:16px;overflow-y:auto;flex:1;background:#fff}
.intake-intro{font-size:.77rem;color:#444;line-height:1.6;margin-bottom:14px;padding:10px 12px;background:#EEF3FF;border-radius:8px;border-left:3px solid #0B2A6B}
.intake-field{margin-bottom:10px}
.intake-field label{display:block;font-size:.68rem;font-weight:700;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em}
.intake-field label .req{color:#c00}
.intake-field input,.intake-field textarea{width:100%;border:1.5px solid #dde;border-radius:7px;padding:8px 10px;font-size:.82rem;outline:none;font-family:inherit;color:#222;background:#fafbff;transition:border-color .15s}
.intake-field input:focus,.intake-field textarea:focus{border-color:#0B2A6B;background:#fff}
.intake-field textarea{resize:none;line-height:1.5}
.field-hint{font-size:.67rem;color:#999;margin-top:3px;line-height:1.4}
.concern-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}
.concern-chip{padding:5px 11px;border-radius:20px;border:1.5px solid #dde;background:#fafbff;font-size:.74rem;cursor:pointer;color:#555;transition:all .15s;font-family:inherit;line-height:1}
.concern-chip:hover{border-color:#0B2A6B;color:#0B2A6B}
.concern-chip.selected{background:#0B2A6B;color:#fff;border-color:#0B2A6B}
#pntc-intake-err{color:#c00;font-size:.73rem;margin-bottom:8px;display:none;padding:6px 10px;background:#fff0f0;border-radius:6px}
#pntc-intake-submit{width:100%;padding:10px;background:#0B2A6B;color:#fff;border:none;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;transition:background .15s;margin-top:6px;letter-spacing:.01em}
#pntc-intake-submit:hover{background:#1244B8}
#pntc-intake-submit:disabled{background:#aab;cursor:not-allowed}

/* ── Chat area ── */
#pntc-chat-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:6px;background:#F8F9FC}
#pntc-chat-messages::-webkit-scrollbar{width:4px}
#pntc-chat-messages::-webkit-scrollbar-thumb{background:#ccd;border-radius:2px}
.pntc-msg-wrap{display:flex;flex-direction:column;max-width:85%}
.pntc-msg-wrap.visitor{align-self:flex-end;align-items:flex-end}
.pntc-msg-wrap.agent{align-self:flex-start;align-items:flex-start}
.pntc-agent-name{font-size:.67rem;font-weight:700;color:#0B2A6B;margin-bottom:2px;padding-left:2px}
.pntc-msg{padding:9px 13px;border-radius:14px;font-size:.82rem;line-height:1.55;word-break:break-word}
.pntc-msg.visitor{background:#0B2A6B;color:#fff;border-bottom-right-radius:3px}
.pntc-msg.agent{background:#fff;color:#222;border-bottom-left-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.pntc-msg.system{background:transparent;color:#999;font-size:.74rem;font-style:italic;box-shadow:none;text-align:center;align-self:center;padding:4px 0}
.pntc-msg-time{font-size:.63rem;color:rgba(0,0,0,.3);margin-top:3px}
.pntc-msg-wrap.visitor .pntc-msg-time{text-align:right;color:rgba(0,0,0,.35)}

/* ── Timeout warning ── */
#pntc-timeout-bar{background:#FFF3CD;border-top:1px solid #FFE082;padding:7px 14px;font-size:.74rem;color:#7D5A00;display:none;align-items:center;gap:8px;flex-shrink:0}
#pntc-timeout-bar button{border:none;background:#0B2A6B;color:#fff;border-radius:5px;padding:3px 10px;font-size:.72rem;font-weight:700;cursor:pointer}

/* ── Input row ── */
#pntc-chat-footer{background:#fff;border-top:1px solid #eee;flex-shrink:0}
#pntc-chat-input-row{display:flex;gap:6px;padding:10px 12px}
#pntc-chat-input{flex:1;border:1.5px solid #dde;border-radius:10px;padding:8px 12px;font-size:.82rem;resize:none;outline:none;max-height:80px;line-height:1.4;font-family:inherit;background:#fafbff;transition:border-color .15s}
#pntc-chat-input:focus{border-color:#0B2A6B;background:#fff}
#pntc-chat-send{width:37px;height:37px;flex-shrink:0;background:#0B2A6B;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;align-self:flex-end;transition:background .15s}
#pntc-chat-send:hover{background:#1244B8}
#pntc-chat-send:disabled{background:#aab;cursor:not-allowed}
#pntc-chat-send svg{width:16px;height:16px;fill:#fff}
#pntc-input-hint{font-size:.64rem;color:#bbb;padding:0 13px 8px;text-align:right}

/* ── Closed state ── */
#pntc-closed-bar{background:#f5f5f5;border-top:1px solid #eee;padding:12px 14px;text-align:center;font-size:.78rem;color:#888;display:none}

@media(max-width:420px){
  #pntc-chat-panel{width:calc(100vw - 16px)!important;right:8px;bottom:80px}
  #pntc-chat-panel.maximized{width:calc(100vw - 16px)!important;height:calc(100vh - 90px)!important;bottom:8px;right:8px}
  #pntc-chat-bubble{bottom:16px;right:16px}
}
`;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM ───────────────────────────────────────────────────────
  var wrapper = document.createElement('div');
  wrapper.id = 'pntc-chat-widget';
  wrapper.innerHTML = `
<button id="pntc-chat-bubble" aria-label="Open live chat">
  <svg class="chat-icon" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
  <i class="close-x">&#x2715;</i>
  <span id="pntc-chat-unread" aria-label="unread messages"></span>
</button>

<div id="pntc-chat-panel" role="dialog" aria-label="Live chat">
  <div id="pntc-chat-header">
    <div id="pntc-header-avatar">&#x1F4AC;</div>
    <div id="pntc-chat-header-info">
      <div id="pntc-chat-header-title">${LABEL} Support</div>
      <div id="pntc-chat-header-sub"><span id="pntc-status-dot"></span> Online now</div>
    </div>
    <button class="pntc-hdr-btn" id="pntc-maximize-btn" title="Expand chat" aria-label="Expand chat">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    </button>
  </div>

  <!-- Intake form -->
  <div id="pntc-intake-form">
    <div class="intake-intro">
      Please fill in your details before we start. In case we get disconnected, we will reach you immediately through your provided contact information.
    </div>
    <div class="intake-field">
      <label>Full Name <span class="req">*</span></label>
      <input id="intake-name" placeholder="e.g. Juan dela Cruz" maxlength="80" autocomplete="name">
    </div>
    <div class="intake-field">
      <label>Email Address <span class="req">*</span></label>
      <input id="intake-email" type="email" placeholder="e.g. juan@email.com" maxlength="120" autocomplete="email">
    </div>
    <div class="intake-field">
      <label>Contact Number <span class="req">*</span></label>
      <input id="intake-contact" type="tel" placeholder="e.g. 09XX XXX XXXX" maxlength="20" autocomplete="tel">
      <div class="field-hint">&#x1F4DE; In case we lose the chat, we will contact you right away.</div>
    </div>
    <div class="intake-field">
      <label>Enquiry Type <span class="req">*</span></label>
      <div class="concern-chips" id="concern-chips">
        <button class="concern-chip" data-value="admission">&#x1F393; Admission</button>
        <button class="concern-chip" data-value="registrar">&#x1F4CB; Registrar</button>
        <button class="concern-chip" data-value="finance">&#x1F4B3; Finance</button>
        <button class="concern-chip" data-value="academics">&#x1F4DA; Academics</button>
        <button class="concern-chip" data-value="other">&#x1F4AC; Other</button>
      </div>
    </div>
    <div class="intake-field">
      <label>Brief Background of Concern</label>
      <textarea id="intake-background" rows="2" placeholder="Describe your concern briefly…" maxlength="400"></textarea>
    </div>
    <div id="pntc-intake-err"></div>
    <button id="pntc-intake-submit">Start Chat &#x2192;</button>
  </div>

  <!-- Chat messages -->
  <div id="pntc-chat-messages" style="display:none"></div>

  <!-- Timeout warning bar -->
  <div id="pntc-timeout-bar">
    <span id="pntc-timeout-text">&#x23F0; No activity for 18 min. Chat closes in 2 minutes.</span>
    <button id="pntc-timeout-keep">Keep Open</button>
  </div>

  <!-- Footer: input or closed notice -->
  <div id="pntc-chat-footer">
    <div id="pntc-chat-input-row" style="display:none">
      <textarea id="pntc-chat-input" placeholder="Type a message…" rows="1" maxlength="1000"></textarea>
      <button id="pntc-chat-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div id="pntc-input-hint" style="display:none">Enter to send &nbsp;·&nbsp; Shift+Enter for new line</div>
    <div id="pntc-closed-bar">This chat session has been closed.</div>
  </div>
</div>`;
  document.body.appendChild(wrapper);

  // ── Refs ──────────────────────────────────────────────────────
  var bubble       = document.getElementById('pntc-chat-bubble');
  var panel        = document.getElementById('pntc-chat-panel');
  var maxBtn       = document.getElementById('pntc-maximize-btn');
  var intakeForm   = document.getElementById('pntc-intake-form');
  var intakeName   = document.getElementById('intake-name');
  var intakeEmail  = document.getElementById('intake-email');
  var intakeContact = document.getElementById('intake-contact');
  var intakeBg     = document.getElementById('intake-background');
  var intakeErr    = document.getElementById('pntc-intake-err');
  var intakeSubmit = document.getElementById('pntc-intake-submit');
  var chipBtns     = document.querySelectorAll('#concern-chips .concern-chip');
  var msgBox       = document.getElementById('pntc-chat-messages');
  var timeoutBar   = document.getElementById('pntc-timeout-bar');
  var timeoutText  = document.getElementById('pntc-timeout-text');
  var timeoutKeep  = document.getElementById('pntc-timeout-keep');
  var inputRow     = document.getElementById('pntc-chat-input-row');
  var inputHint    = document.getElementById('pntc-input-hint');
  var chatInput    = document.getElementById('pntc-chat-input');
  var sendBtn      = document.getElementById('pntc-chat-send');
  var closedBar    = document.getElementById('pntc-closed-bar');
  var unreadBadge  = document.getElementById('pntc-chat-unread');

  var selectedConcern = null;

  // ── Chip selection ────────────────────────────────────────────
  chipBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      chipBtns.forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedConcern = btn.dataset.value;
    });
  });

  // ── Maximize toggle ───────────────────────────────────────────
  maxBtn.addEventListener('click', function () {
    isMaximized = !isMaximized;
    panel.classList.toggle('maximized', isMaximized);
    maxBtn.title = isMaximized ? 'Shrink chat' : 'Expand chat';
    maxBtn.innerHTML = isMaximized
      ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 14h6v6M20 10h-6V4M10 20l-7-7M14 4l7 7"/></svg>'
      : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
    msgBox.scrollTop = msgBox.scrollHeight;
  });

  // ── Helpers ───────────────────────────────────────────────────
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  function renderMsg(msg) {
    if (knownIds[msg.id]) return;
    knownIds[msg.id] = true;

    if (msg.sender === 'system') {
      var sd = document.createElement('div');
      sd.className = 'pntc-msg system';
      sd.textContent = msg.message;
      msgBox.appendChild(sd);
      msgBox.scrollTop = msgBox.scrollHeight;
      return;
    }

    var wrap = document.createElement('div');
    wrap.className = 'pntc-msg-wrap ' + msg.sender;

    if (msg.sender === 'agent' && msg.agent_name) {
      var nameEl = document.createElement('div');
      nameEl.className = 'pntc-agent-name';
      nameEl.textContent = msg.agent_name;
      wrap.appendChild(nameEl);
    }

    var bubble = document.createElement('div');
    bubble.className = 'pntc-msg ' + msg.sender;
    bubble.innerHTML = esc(msg.message);
    wrap.appendChild(bubble);

    var meta = document.createElement('div');
    meta.className = 'pntc-msg-time';
    meta.textContent = fmtTime(msg.created_at);
    wrap.appendChild(meta);

    msgBox.appendChild(wrap);
    msgBox.scrollTop = msgBox.scrollHeight;

    if (!isOpen && msg.sender === 'agent') { unread++; updateBadge(); }
  }

  function updateBadge() {
    if (unread > 0 && !isOpen) {
      unreadBadge.textContent = unread > 9 ? '9+' : unread;
      unreadBadge.style.display = 'flex';
    } else {
      unreadBadge.style.display = 'none';
    }
  }

  function showErr(msg) {
    intakeErr.textContent = msg;
    intakeErr.style.display = 'block';
  }

  // ── Inactivity timeout ────────────────────────────────────────
  function resetActivity() {
    lastActivity = Date.now();
    timeoutBar.style.display = 'none';
    clearTimeout(warnTimer);
    clearTimeout(timeoutTimer);
    if (sessionId && !isClosed) scheduleTimeout();
  }

  function scheduleTimeout() {
    warnTimer = setTimeout(function () {
      timeoutBar.style.display = 'flex';
    }, WARNING_MS);

    timeoutTimer = setTimeout(function () {
      triggerInactivityClose();
    }, TIMEOUT_MS);
  }

  async function triggerInactivityClose() {
    if (!sessionId || isClosed) return;
    isClosed = true;
    stopPolling();
    timeoutBar.style.display = 'none';
    renderMsg({ id: 'sys_timeout', sender: 'system', message: 'Chat closed due to inactivity (20 min).', created_at: new Date().toISOString() });
    showClosedState();
    try {
      await fetch(API + '/session/' + sessionId + '/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });
    } catch (e) {}
    try { sessionStorage.removeItem('pntc_chat_' + SITE); } catch (e) {}
  }

  timeoutKeep.addEventListener('click', function () {
    resetActivity();
  });

  // ── Session ───────────────────────────────────────────────────
  async function createSession(fields) {
    var r = await fetch(API + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: SITE,
        visitorName:       fields.name,
        visitorEmail:      fields.email,
        visitorContact:    fields.contact,
        concernType:       fields.concernType,
        concernBackground: fields.background
      })
    });
    var d = await r.json();
    if (!d.sessionId) throw new Error('Session error');
    sessionId = d.sessionId;
    try { sessionStorage.setItem('pntc_chat_' + SITE, sessionId); } catch (e) {}
    return sessionId;
  }

  async function sendMessage(text) {
    if (!sessionId) return;
    await fetch(API + '/session/' + sessionId + '/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
  }

  async function poll() {
    if (!sessionId) return;
    try {
      var r = await fetch(API + '/session/' + sessionId + '/messages');
      var msgs = await r.json();
      if (Array.isArray(msgs)) msgs.forEach(renderMsg);
    } catch (e) {}
  }

  function startPolling() {
    if (pollTimer) return;
    poll();
    pollTimer = setInterval(poll, 3000);
  }

  function stopPolling() { clearInterval(pollTimer); pollTimer = null; }

  function showClosedState() {
    inputRow.style.display = 'none';
    inputHint.style.display = 'none';
    chatInput.disabled = true;
    closedBar.style.display = 'block';
  }

  // ── Intake submit ─────────────────────────────────────────────
  intakeSubmit.addEventListener('click', async function () {
    var name    = intakeName.value.trim();
    var email   = intakeEmail.value.trim();
    var contact = intakeContact.value.trim();
    var bg      = intakeBg.value.trim();

    intakeErr.style.display = 'none';
    if (!name)    { showErr('Please enter your full name.'); intakeName.focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('Please enter a valid email address.'); intakeEmail.focus(); return; }
    if (!contact) { showErr('Please enter your contact number.'); intakeContact.focus(); return; }
    if (!selectedConcern) { showErr('Please select an enquiry type.'); return; }

    intakeSubmit.disabled = true;
    intakeSubmit.textContent = 'Starting…';

    try {
      await createSession({ name, email, contact, concernType: selectedConcern, background: bg });
      showChatMode(name);
      var label = { admission:'Admission', registrar:'Registrar', finance:'Finance', academics:'Academics', other:'General Enquiry' }[selectedConcern] || selectedConcern;
      await sendMessage('Hi, I have a concern about: ' + label + (bg ? '.\n\n' + bg : '.'));
      await poll();
    } catch (e) {
      intakeSubmit.disabled = false;
      intakeSubmit.textContent = 'Start Chat →';
      showErr('Could not start chat. Please try again.');
    }
  });

  function showChatMode(name) {
    intakeForm.style.display = 'none';
    msgBox.style.display     = 'flex';
    msgBox.style.flexDirection = 'column';
    inputRow.style.display   = 'flex';
    inputHint.style.display  = 'block';
    renderMsg({ id: '__greet__', sender: 'agent', message: 'Hello ' + name + '! 👋 Thank you for reaching out to ' + LABEL + '. An agent will be with you shortly.', created_at: new Date().toISOString() });
    chatInput.focus();
    startPolling();
    resetActivity();
  }

  // ── Open / Close panel ────────────────────────────────────────
  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    bubble.classList.add('open');
    unread = 0;
    updateBadge();
    msgBox.scrollTop = msgBox.scrollHeight;
    if (sessionId && !isClosed) startPolling();
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('open');
    bubble.classList.remove('open');
    stopPolling();
  }

  bubble.addEventListener('click', function () {
    if (isOpen) closeChat(); else openChat();
  });

  // ── Send ──────────────────────────────────────────────────────
  async function doSend() {
    var text = chatInput.value.trim();
    if (!text || !sessionId || isClosed) return;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    resetActivity();
    renderMsg({ id: 'opt_' + Date.now(), sender: 'visitor', message: text, created_at: new Date().toISOString() });
    msgBox.scrollTop = msgBox.scrollHeight;
    await sendMessage(text);
    await poll();
  }

  sendBtn.addEventListener('click', doSend);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  // ── Restore session ───────────────────────────────────────────
  if (sessionId) {
    showChatMode('there');
  }
})();
