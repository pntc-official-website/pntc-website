(function () {
  'use strict';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var API = '/api/chat';
  var SITE_LABELS = { colleges: 'PNTC Colleges', shs: 'PNTC Senior High School', maritime: 'Maritime Training Center', aman: 'Aman Sinaya', main: 'PNTC' };
  var LABEL = SITE_LABELS[SITE] || 'PNTC';

  var sessionId = null;
  var isOpen = false;
  var knownIds = {};
  var unread = 0;
  var pollTimer = null;
  var greeting = { id: '__greet__', sender: 'agent', message: 'Hello! Welcome to ' + LABEL + '. How can we help you today?', created_at: new Date().toISOString() };

  try { sessionId = sessionStorage.getItem('pntc_chat_' + SITE); } catch (e) {}

  // ── Styles ────────────────────────────────────────────────────
  var css = `
#pntc-chat-widget *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
#pntc-chat-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#0B2A6B;box-shadow:0 4px 20px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;border:none;transition:transform .2s,box-shadow .2s}
#pntc-chat-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.45)}
#pntc-chat-bubble svg{width:26px;height:26px;fill:#fff;transition:opacity .2s}
#pntc-chat-bubble .close-x{display:none;font-size:22px;color:#fff;line-height:1}
#pntc-chat-bubble.open svg{display:none}
#pntc-chat-bubble.open .close-x{display:block}
#pntc-chat-unread{position:absolute;top:-4px;right:-4px;background:#C8960C;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px}
#pntc-chat-panel{position:fixed;bottom:92px;right:24px;z-index:99998;width:340px;max-height:520px;border-radius:12px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform:scale(.9) translateY(12px);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .22s ease}
#pntc-chat-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
#pntc-chat-header{background:#0B2A6B;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}
#pntc-chat-header-dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex-shrink:0}
#pntc-chat-header-title{color:#fff;font-size:.88rem;font-weight:600;flex:1}
#pntc-chat-header-sub{color:rgba(255,255,255,.55);font-size:.72rem;margin-top:2px}
#pntc-chat-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:320px}
#pntc-chat-messages::-webkit-scrollbar{width:4px}
#pntc-chat-messages::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
.pntc-msg{max-width:82%;padding:9px 12px;border-radius:12px;font-size:.82rem;line-height:1.5;word-break:break-word}
.pntc-msg.visitor{align-self:flex-end;background:#0B2A6B;color:#fff;border-bottom-right-radius:3px}
.pntc-msg.agent{align-self:flex-start;background:#F1F3F9;color:#222;border-bottom-left-radius:3px}
.pntc-msg-time{font-size:.65rem;color:rgba(0,0,0,.35);margin-top:3px;text-align:right}
.pntc-msg.agent .pntc-msg-time{text-align:left}
.pntc-msg.visitor .pntc-msg-time{color:rgba(255,255,255,.5)}
#pntc-chat-name-form{padding:12px;border-top:1px solid #eee;flex-shrink:0}
#pntc-chat-name-form p{font-size:.78rem;color:#555;margin-bottom:8px}
#pntc-chat-name-row{display:flex;gap:6px}
#pntc-chat-name-input{flex:1;border:1.5px solid #dde;border-radius:6px;padding:7px 10px;font-size:.82rem;outline:none}
#pntc-chat-name-input:focus{border-color:#0B2A6B}
#pntc-chat-name-btn{padding:7px 14px;background:#0B2A6B;color:#fff;border:none;border-radius:6px;font-size:.82rem;font-weight:600;cursor:pointer}
#pntc-chat-input-row{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #eee;flex-shrink:0;background:#fff}
#pntc-chat-input{flex:1;border:1.5px solid #dde;border-radius:8px;padding:8px 11px;font-size:.82rem;resize:none;outline:none;max-height:80px;line-height:1.4}
#pntc-chat-input:focus{border-color:#0B2A6B}
#pntc-chat-send{width:36px;height:36px;flex-shrink:0;background:#0B2A6B;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;align-self:flex-end;transition:background .15s}
#pntc-chat-send:hover{background:#1244B8}
#pntc-chat-send svg{width:16px;height:16px;fill:#fff}
#pntc-chat-typing{padding:0 12px 8px;font-size:.72rem;color:#888;min-height:20px;flex-shrink:0}
.pntc-msg-dots{display:inline-flex;gap:3px;align-items:center;padding:4px 0}
.pntc-msg-dots span{width:6px;height:6px;border-radius:50%;background:#999;animation:pntc-blink 1.2s infinite}
.pntc-msg-dots span:nth-child(2){animation-delay:.2s}
.pntc-msg-dots span:nth-child(3){animation-delay:.4s}
@keyframes pntc-blink{0%,80%,100%{opacity:.2}40%{opacity:1}}
@media(max-width:420px){#pntc-chat-panel{width:calc(100vw - 24px);right:12px;bottom:80px}#pntc-chat-bubble{bottom:16px;right:16px}}
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
  <span class="close-x">✕</span>
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
  <div id="pntc-chat-messages"></div>
  <div id="pntc-chat-typing"></div>
  <div id="pntc-chat-name-form">
    <p>Before we start, what's your name? (optional)</p>
    <div id="pntc-chat-name-row">
      <input id="pntc-chat-name-input" placeholder="Your name…" maxlength="60" autocomplete="off">
      <button id="pntc-chat-name-btn">Start Chat</button>
    </div>
  </div>
  <div id="pntc-chat-input-row" style="display:none">
    <textarea id="pntc-chat-input" placeholder="Type a message…" rows="1" maxlength="1000"></textarea>
    <button id="pntc-chat-send" aria-label="Send">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>`;
  document.body.appendChild(wrapper);

  // ── Refs ──────────────────────────────────────────────────────
  var bubble     = document.getElementById('pntc-chat-bubble');
  var panel      = document.getElementById('pntc-chat-panel');
  var msgBox     = document.getElementById('pntc-chat-messages');
  var typingEl   = document.getElementById('pntc-chat-typing');
  var nameForm   = document.getElementById('pntc-chat-name-form');
  var nameInput  = document.getElementById('pntc-chat-name-input');
  var nameBtn    = document.getElementById('pntc-chat-name-btn');
  var inputRow   = document.getElementById('pntc-chat-input-row');
  var chatInput  = document.getElementById('pntc-chat-input');
  var sendBtn    = document.getElementById('pntc-chat-send');
  var unreadBadge = document.getElementById('pntc-chat-unread');

  // ── Helpers ───────────────────────────────────────────────────
  function fmtTime(iso) {
    var d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMsg(msg) {
    if (knownIds[msg.id]) return;
    knownIds[msg.id] = true;
    var div = document.createElement('div');
    div.className = 'pntc-msg ' + msg.sender;
    div.innerHTML = '<div>' + msg.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</div>'
      + '<div class="pntc-msg-time">' + fmtTime(msg.created_at) + '</div>';
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
    if (!isOpen && msg.sender === 'agent') {
      unread++;
      updateBadge();
    }
  }

  function updateBadge() {
    if (unread > 0 && !isOpen) {
      unreadBadge.textContent = unread > 9 ? '9+' : unread;
      unreadBadge.style.display = 'flex';
    } else {
      unreadBadge.style.display = 'none';
    }
  }

  function scrollBottom() { msgBox.scrollTop = msgBox.scrollHeight; }

  // ── Session ───────────────────────────────────────────────────
  async function createSession(name) {
    var r = await fetch(API + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: SITE, visitorName: name || 'Visitor' })
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

  function stopPolling() {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  // ── UI ────────────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    bubble.classList.add('open');
    unread = 0;
    updateBadge();
    scrollBottom();
    // Show greeting
    if (!knownIds[greeting.id] && !sessionId) {
      renderMsg(greeting);
    }
    if (sessionId) {
      showInputMode();
      startPolling();
    }
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('open');
    bubble.classList.remove('open');
    stopPolling();
  }

  function showInputMode() {
    nameForm.style.display = 'none';
    inputRow.style.display = 'flex';
    chatInput.focus();
    startPolling();
  }

  bubble.addEventListener('click', function () {
    if (isOpen) closeChat(); else openChat();
  });

  nameBtn.addEventListener('click', async function () {
    var name = nameInput.value.trim() || 'Visitor';
    nameBtn.disabled = true;
    nameBtn.textContent = 'Starting…';
    try {
      await createSession(name);
      showInputMode();
    } catch (e) {
      nameBtn.disabled = false;
      nameBtn.textContent = 'Start Chat';
    }
  });

  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') nameBtn.click();
  });

  async function doSend() {
    var text = chatInput.value.trim();
    if (!text || !sessionId) return;
    chatInput.value = '';
    chatInput.style.height = 'auto';
    var optimistic = { id: 'opt_' + Date.now(), sender: 'visitor', message: text, created_at: new Date().toISOString() };
    renderMsg(optimistic);
    scrollBottom();
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

  // If session exists from previous navigation, restore it
  if (sessionId) {
    showInputMode();
    // Show greeting first so it's there even before messages load
    renderMsg(greeting);
  }
})();
