(function () {
  'use strict';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var API = '/api/chat';
  var SITE_LABELS = { colleges: 'PNTC Colleges', shs: 'PNTC Senior High School', maritime: 'Maritime Training Center', aman: 'Aman Sinaya', main: 'PNTC' };
  var LABEL = SITE_LABELS[SITE] || 'PNTC';

  var CONCERN_TYPES = [
    { value: 'admission',  label: '🎓 Admission' },
    { value: 'registrar',  label: '📋 Registrar' },
    { value: 'finance',    label: '💳 Finance' },
    { value: 'academics',  label: '📚 Academics' },
    { value: 'other',      label: '💬 Other' }
  ];

  var sessionId = null;
  var isOpen = false;
  var knownIds = {};
  var unread = 0;
  var pollTimer = null;

  try { sessionId = sessionStorage.getItem('pntc_chat_' + SITE); } catch (e) {}

  // ── Styles ────────────────────────────────────────────────────
  var css = `
#pntc-chat-widget *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
#pntc-chat-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#0B2A6B;box-shadow:0 4px 20px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;border:none;transition:transform .2s,box-shadow .2s}
#pntc-chat-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.45)}
#pntc-chat-bubble svg{width:26px;height:26px;fill:#fff}
#pntc-chat-bubble .close-x{display:none;font-size:22px;color:#fff;line-height:1}
#pntc-chat-bubble.open svg{display:none}
#pntc-chat-bubble.open .close-x{display:block}
#pntc-chat-unread{position:absolute;top:-4px;right:-4px;background:#C8960C;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px}
#pntc-chat-panel{position:fixed;bottom:92px;right:24px;z-index:99998;width:350px;max-height:600px;border-radius:14px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform:scale(.9) translateY(12px);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .22s ease}
#pntc-chat-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
#pntc-chat-header{background:#0B2A6B;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}
#pntc-chat-header-dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex-shrink:0}
#pntc-chat-header-title{color:#fff;font-size:.9rem;font-weight:700;flex:1}
#pntc-chat-header-sub{color:rgba(255,255,255,.55);font-size:.71rem;margin-top:2px}

/* ── Intake form ── */
#pntc-intake-form{padding:16px;overflow-y:auto;flex:1}
#pntc-intake-form .intake-intro{font-size:.78rem;color:#444;line-height:1.55;margin-bottom:14px;padding:10px 12px;background:#F0F4FF;border-radius:8px;border-left:3px solid #0B2A6B}
.intake-field{margin-bottom:11px}
.intake-field label{display:block;font-size:.72rem;font-weight:600;color:#555;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em}
.intake-field label span.req{color:#c00}
.intake-field input,.intake-field textarea,.intake-field select{width:100%;border:1.5px solid #dde;border-radius:7px;padding:8px 10px;font-size:.82rem;outline:none;font-family:inherit;color:#222;background:#fff}
.intake-field input:focus,.intake-field textarea:focus,.intake-field select:focus{border-color:#0B2A6B}
.intake-field textarea{resize:none;line-height:1.5}
.intake-field .field-hint{font-size:.68rem;color:#888;margin-top:3px;line-height:1.4}
.concern-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
.concern-chip{padding:5px 12px;border-radius:20px;border:1.5px solid #dde;background:#fff;font-size:.75rem;cursor:pointer;color:#555;transition:all .15s;font-family:inherit}
.concern-chip.selected{background:#0B2A6B;color:#fff;border-color:#0B2A6B}
#pntc-intake-err{color:#c00;font-size:.74rem;margin-bottom:8px;display:none}
#pntc-intake-submit{width:100%;padding:10px;background:#0B2A6B;color:#fff;border:none;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;transition:background .15s;margin-top:4px}
#pntc-intake-submit:hover{background:#1244B8}
#pntc-intake-submit:disabled{background:#aaa;cursor:not-allowed}

/* ── Chat area ── */
#pntc-chat-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px;min-height:160px;max-height:300px}
#pntc-chat-messages::-webkit-scrollbar{width:4px}
#pntc-chat-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
.pntc-msg{max-width:82%;padding:9px 12px;border-radius:12px;font-size:.82rem;line-height:1.5;word-break:break-word}
.pntc-msg.visitor{align-self:flex-end;background:#0B2A6B;color:#fff;border-bottom-right-radius:3px}
.pntc-msg.agent{align-self:flex-start;background:#F1F3F9;color:#222;border-bottom-left-radius:3px}
.pntc-msg-time{font-size:.65rem;color:rgba(0,0,0,.35);margin-top:3px;text-align:right}
.pntc-msg.agent .pntc-msg-time{text-align:left}
.pntc-msg.visitor .pntc-msg-time{color:rgba(255,255,255,.5)}
#pntc-chat-input-row{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #eee;flex-shrink:0;background:#fff}
#pntc-chat-input{flex:1;border:1.5px solid #dde;border-radius:8px;padding:8px 11px;font-size:.82rem;resize:none;outline:none;max-height:80px;line-height:1.4;font-family:inherit}
#pntc-chat-input:focus{border-color:#0B2A6B}
#pntc-chat-send{width:36px;height:36px;flex-shrink:0;background:#0B2A6B;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;align-self:flex-end;transition:background .15s}
#pntc-chat-send:hover{background:#1244B8}
#pntc-chat-send svg{width:16px;height:16px;fill:#fff}
@media(max-width:420px){#pntc-chat-panel{width:calc(100vw - 20px);right:10px;bottom:82px}#pntc-chat-bubble{bottom:16px;right:16px}}
`;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM ───────────────────────────────────────────────────────
  var wrapper = document.createElement('div');
  wrapper.id = 'pntc-chat-widget';
  wrapper.innerHTML = `
<button id="pntc-chat-bubble" aria-label="Open live chat">
  <svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
  <span class="close-x">&#x2715;</span>
  <span id="pntc-chat-unread"></span>
</button>
<div id="pntc-chat-panel" role="dialog" aria-label="Live chat">
  <div id="pntc-chat-header">
    <div id="pntc-chat-header-dot"></div>
    <div>
      <div id="pntc-chat-header-title">${LABEL}</div>
      <div id="pntc-chat-header-sub">Typically replies in a few minutes</div>
    </div>
  </div>

  <!-- Intake form (shown before session starts) -->
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
      <div class="field-hint">In case we lose the chat, we will contact you right away.</div>
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
    <button id="pntc-intake-submit">Start Chat &rarr;</button>
  </div>

  <!-- Chat area (shown after session starts) -->
  <div id="pntc-chat-messages" style="display:none"></div>
  <div id="pntc-chat-input-row" style="display:none">
    <textarea id="pntc-chat-input" placeholder="Type a message… (Enter to send)" rows="1" maxlength="1000"></textarea>
    <button id="pntc-chat-send" aria-label="Send">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>`;
  document.body.appendChild(wrapper);

  // ── Refs ──────────────────────────────────────────────────────
  var bubble      = document.getElementById('pntc-chat-bubble');
  var panel       = document.getElementById('pntc-chat-panel');
  var intakeForm  = document.getElementById('pntc-intake-form');
  var intakeName  = document.getElementById('intake-name');
  var intakeEmail = document.getElementById('intake-email');
  var intakeContact = document.getElementById('intake-contact');
  var intakeBg    = document.getElementById('intake-background');
  var intakeErr   = document.getElementById('pntc-intake-err');
  var intakeSubmit = document.getElementById('pntc-intake-submit');
  var chipBtns    = document.querySelectorAll('.concern-chip');
  var msgBox      = document.getElementById('pntc-chat-messages');
  var inputRow    = document.getElementById('pntc-chat-input-row');
  var chatInput   = document.getElementById('pntc-chat-input');
  var sendBtn     = document.getElementById('pntc-chat-send');
  var unreadBadge = document.getElementById('pntc-chat-unread');

  var selectedConcern = null;

  // ── Concern chip selection ────────────────────────────────────
  chipBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      chipBtns.forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedConcern = btn.dataset.value;
    });
  });

  // ── Helpers ───────────────────────────────────────────────────
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMsg(msg) {
    if (knownIds[msg.id]) return;
    knownIds[msg.id] = true;
    var div = document.createElement('div');
    div.className = 'pntc-msg ' + msg.sender;
    div.innerHTML = '<div>' + msg.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') + '</div>'
      + '<div class="pntc-msg-time">' + fmtTime(msg.created_at) + '</div>';
    msgBox.appendChild(div);
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // ── Intake submit ─────────────────────────────────────────────
  intakeSubmit.addEventListener('click', async function () {
    var name    = intakeName.value.trim();
    var email   = intakeEmail.value.trim();
    var contact = intakeContact.value.trim();
    var bg      = intakeBg.value.trim();

    intakeErr.style.display = 'none';

    if (!name) { showErr('Please enter your full name.'); intakeName.focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('Please enter a valid email address.'); intakeEmail.focus(); return; }
    if (!contact) { showErr('Please enter your contact number.'); intakeContact.focus(); return; }
    if (!selectedConcern) { showErr('Please select an enquiry type.'); return; }

    intakeSubmit.disabled = true;
    intakeSubmit.textContent = 'Starting…';

    try {
      await createSession({ name, email, contact, concernType: selectedConcern, background: bg });
      showChatMode(name);
      startPolling();
      // Post an opening message summarizing their concern
      var label = { admission:'Admission', registrar:'Registrar', finance:'Finance', academics:'Academics', other:'General Enquiry' }[selectedConcern] || selectedConcern;
      var openMsg = 'Hi, I have a concern about: ' + label + (bg ? '.\n\n' + bg : '.');
      await sendMessage(openMsg);
      await poll();
    } catch (e) {
      intakeSubmit.disabled = false;
      intakeSubmit.textContent = 'Start Chat →';
      showErr('Could not start chat. Please try again.');
    }
  });

  function showErr(msg) {
    intakeErr.textContent = msg;
    intakeErr.style.display = 'block';
  }

  function showChatMode(name) {
    intakeForm.style.display = 'none';
    msgBox.style.display = 'flex';
    msgBox.style.flexDirection = 'column';
    inputRow.style.display = 'flex';
    // greeting
    renderMsg({ id: '__greet__', sender: 'agent', message: 'Hello ' + name + '! Thank you for reaching out to ' + LABEL + '. An agent will be with you shortly. \u{1F44B}', created_at: new Date().toISOString() });
    chatInput.focus();
  }

  // ── Toggle ────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    bubble.classList.add('open');
    unread = 0;
    updateBadge();
    msgBox.scrollTop = msgBox.scrollHeight;
    if (sessionId) startPolling();
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

  // ── Send message ──────────────────────────────────────────────
  async function doSend() {
    var text = chatInput.value.trim();
    if (!text || !sessionId) return;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    renderMsg({ id: 'opt_' + Date.now(), sender: 'visitor', message: text, created_at: new Date().toISOString() });
    msgBox.scrollTop = msgBox.scrollHeight;
    await sendMessage(text);
    await poll();
  }

  sendBtn.addEventListener('click', doSend);
  chatInput && chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });
  chatInput && chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  // ── Restore existing session ──────────────────────────────────
  if (sessionId) {
    showChatMode('there');
    startPolling();
  }
})();
