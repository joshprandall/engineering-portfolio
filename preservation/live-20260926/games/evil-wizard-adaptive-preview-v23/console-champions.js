// Handheld presentation: large champion selection and configurable controls.
// The game itself remains inside the same-origin Godot iframe.
(() => {
  'use strict';
  const rail = document.querySelector('.rail.left');
  const frame = document.getElementById('game');
  const consoleShell = document.querySelector('.console');
  const rightHead = document.querySelector('.right-head');
  if (!rail || !frame || !consoleShell || !rightHead) return;

  const champions = [
    ['warrior','Warrior'],['mage','Mage'],['rogue','Rogue'],['paladin','Paladin'],
    ['archer','Archer'],['barbarian','Barbarian'],['fighter','Fighter'],['monk','Monk'],
    ['ranger','Ranger'],['cleric','Cleric'],['bard','Bard'],['druid','Druid'],
    ['sorcerer','Sorcerer'],['warlock','Warlock'],['wizard','Wizard']
  ];
  const style = document.createElement('style');
  style.textContent = `
    .champion-picker{width:100%;max-width:182px;display:flex;flex-direction:column;align-items:stretch;gap:4px}
    .champion-picker label{font-size:10px;letter-spacing:.08em;text-align:center;color:#f4d292;font-weight:800}
    .champion-picker select,.champion-picker button{width:100%;min-height:32px;border:1px solid #8e9aad;border-radius:8px;background:#141b25;color:#f9f3e6;font:600 12px system-ui;padding:4px;touch-action:manipulation}
    .champion-picker button{background:linear-gradient(#6b5030,#342717);border-color:#e6be76;letter-spacing:.07em}
    .champion-picker select:focus-visible,.champion-picker button:focus-visible{outline:2px solid white;outline-offset:2px}
    .console{--control-factor:1}
    .console .screen{box-shadow:inset 0 0 0 1px #8693a055,0 0 18px #e6be7614}
    .console .screen iframe{transition:filter .18s ease}
    .console[data-visibility="clarity"] .screen iframe{filter:brightness(1.07) contrast(1.07)}
    .console[data-visibility="bright"] .screen iframe{filter:brightness(1.17) contrast(1.04)}
    .console[data-size="compact"]{--control-factor:.88}
    .console[data-size="large"]{--control-factor:1.08}
    .console .actions .round{width:calc(var(--button)*var(--control-factor));height:calc(var(--button)*var(--control-factor))}
    .console .dpad .round{width:calc(clamp(30px,4.3vh,43px)*var(--control-factor));height:calc(clamp(30px,4.3vh,43px)*var(--control-factor))}
    .console .joy{width:calc(clamp(83px,12vw,142px)*var(--control-factor));height:calc(clamp(83px,12vw,142px)*var(--control-factor))}
    .console .rail{min-width:0}
    .console .action .round:not(.primary){border-color:#9ca8b8}
    .console .round:focus-visible,.console .joy:focus-visible{outline:3px solid #f8d492;outline-offset:2px}
    .console[data-hand="left"] .rail.left{grid-column:3;grid-row:1}
    .console[data-hand="left"] .rail.right{grid-column:1;grid-row:1}
    .console[data-hand="left"] .screen-bezel{grid-column:2;grid-row:1}
    .console-options-trigger{font-size:18px!important;flex:none}
    .console-options{width:min(460px,calc(100vw - 24px));max-height:calc(100dvh - 20px);overflow:auto;margin:auto;padding:20px;border:1px solid #b9965c;border-radius:14px;color:#f8f3e8;background:linear-gradient(145deg,#28313d,#0d1119);box-shadow:0 24px 65px #000d;font:500 14px/1.5 system-ui}
    .console-options::backdrop{background:#020307d9}
    .console-options header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}
    .console-options h2{font-size:20px;line-height:1.2;margin:0;color:#f5d399}
    .console-options p{font-size:12px;color:#d0d6df;margin:8px 0 12px}
    .console-options label{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:10px 0;font-weight:650}
    .console-options select{min-width:138px;min-height:42px;border:1px solid #8391a5;background:#17202b;color:#f9f4e9;border-radius:7px;padding:8px;font:inherit}
    .console-options button{min-width:44px;min-height:44px;border:1px solid #8291a6;border-radius:9px;background:#243040;color:#f8f3e8;padding:7px 12px}
    .console-options .key-guide{border-top:1px solid #556173;margin-top:14px;padding-top:10px}
    .console-options .key-guide strong{color:#f5d399}
    .console-options button:focus-visible,.console-options select:focus-visible{outline:3px solid #f5d399;outline-offset:2px}
    @media(max-height:430px){.champion-picker{gap:3px}.champion-picker select,.champion-picker button{min-height:27px;padding:2px;font-size:10px}.champion-picker label{font-size:9px}}
    @media(max-height:350px){.rail .hint{display:none}.console .rail{gap:3px;padding:4px}.console .joy{width:calc(clamp(70px,21vh,96px)*var(--control-factor));height:calc(clamp(70px,21vh,96px)*var(--control-factor))}}
    @media(prefers-reduced-motion:reduce){.console .screen iframe{transition:none}}
  `;
  document.head.appendChild(style);

  const picker = document.createElement('div');
  picker.className = 'champion-picker';
  const label = document.createElement('label');
  label.htmlFor = 'champion-choice';
  label.textContent = 'CHOOSE CHAMPION';
  const select = document.createElement('select');
  select.id = 'champion-choice';
  for (const [value, caption] of champions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = caption;
    select.appendChild(option);
  }
  const start = document.createElement('button');
  start.id = 'start-champion';
  start.type = 'button';
  start.textContent = 'START GAME';
  start.setAttribute('aria-label','Start game with selected champion');
  start.addEventListener('click', () => {
    frame.contentWindow?.postMessage({channel:'evil-wizard-console/v1',kind:'start',hero_class:select.value},location.origin);
    frame.focus();
  });
  picker.append(label,select,start);
  rail.appendChild(picker);

  // Presentation controls change only the handheld shell, not the simulation.
  const defaults = {size:'standard',visibility:'normal',hand:'right'};
  const allowed = {size:['compact','standard','large'],visibility:['normal','clarity','bright'],hand:['right','left']};
  const settings = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem('evil-wizard-console-settings-v1') || '{}');
    for (const name of Object.keys(defaults)) if (allowed[name].includes(saved[name])) settings[name] = saved[name];
  } catch (_) { /* Private browsing or blocked storage: use safe defaults. */ }
  function applySettings() {
    for (const name of Object.keys(defaults)) consoleShell.dataset[name] = settings[name];
    try { localStorage.setItem('evil-wizard-console-settings-v1', JSON.stringify(settings)); } catch (_) {}
  }
  applySettings();

  const trigger = document.createElement('button');
  trigger.className = 'round pause console-options-trigger';
  trigger.type = 'button';
  trigger.textContent = '⚙';
  trigger.title = 'Controls and display';
  trigger.setAttribute('aria-label','Controls and display settings');
  const pause = rightHead.querySelector('button[data-action="pause"]');
  rightHead.insertBefore(trigger, pause);

  const dialog = document.createElement('dialog');
  dialog.className = 'console-options';
  dialog.setAttribute('aria-labelledby','console-options-title');
  dialog.innerHTML = `
    <header><h2 id="console-options-title">Controls &amp; display</h2><button id="console-options-close" type="button" aria-label="Close settings">Close ✕</button></header>
    <p>Changes apply immediately. You can switch hands or adjust visibility without restarting your game.</p>
    <label for="console-size">Control size <select id="console-size"><option value="compact">Compact</option><option value="standard">Standard</option><option value="large">Large</option></select></label>
    <label for="console-hand">Control position <select id="console-hand"><option value="right">Joystick left</option><option value="left">Joystick right</option></select></label>
    <label for="console-visibility">Game visibility <select id="console-visibility"><option value="normal">Original</option><option value="clarity">Clearer</option><option value="bright">Brighter</option></select></label>
    <div class="key-guide"><strong>Desktop Web &amp; keyboard</strong><p>A / D or ← / → move · S / Q crouch · W / E jump · Space / J / left click attack · K heavy · Shift dash · F interact · L / I abilities · U ultimate · Esc pause.</p><strong>Handheld</strong><p>Drag the stick and hold action buttons together. Tap ↑ to jump; ↓ to crouch. Rotate to landscape for the full console.</p></div>
  `;
  document.body.appendChild(dialog);
  for (const name of Object.keys(defaults)) {
    const control = dialog.querySelector(`#console-${name}`);
    if (!control) continue;
    control.value = settings[name];
    control.addEventListener('change', () => {
      if (!allowed[name].includes(control.value)) return;
      settings[name] = control.value;
      applySettings();
    });
  }
  const close = dialog.querySelector('#console-options-close');
  const closeDialog = () => { if (dialog.open) dialog.close(); trigger.focus(); };
  close.addEventListener('click',closeDialog);
  trigger.addEventListener('click',() => {
    // The original console's blur handler releases any held virtual keys.
    window.dispatchEvent(new Event('blur'));
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
})();
