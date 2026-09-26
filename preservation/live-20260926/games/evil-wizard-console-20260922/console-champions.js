// Large accessible champion selection for small landscape screens. The original
// Godot champion cards still work with mouse, keyboard and physical controllers.
(() => {
  'use strict';
  const rail = document.querySelector('.rail.left');
  const frame = document.getElementById('game');
  if (!rail || !frame) return;
  const options = [
    ['warrior','Warrior'],['mage','Mage'],['rogue','Rogue'],['paladin','Paladin'],
    ['archer','Archer'],['barbarian','Barbarian'],['fighter','Fighter'],['monk','Monk'],
    ['ranger','Ranger'],['cleric','Cleric'],['bard','Bard'],['druid','Druid'],
    ['sorcerer','Sorcerer'],['warlock','Warlock'],['wizard','Wizard']
  ];
  const style = document.createElement('style');
  style.textContent = `
    .champion-picker{width:100%;max-width:182px;display:flex;flex-direction:column;align-items:stretch;gap:4px}
    .champion-picker label{font-size:9px;letter-spacing:.1em;text-align:center;color:#e6be76;font-weight:700}
    .champion-picker select,.champion-picker button{width:100%;min-height:31px;border:1px solid #8998ad;border-radius:8px;background:#141b25;color:#f9f3e6;font:600 12px system-ui;padding:4px;touch-action:manipulation}
    .champion-picker button{background:linear-gradient(#574329,#302718);border-color:#e6be76;letter-spacing:.07em}
    .champion-picker select:focus-visible,.champion-picker button:focus-visible{outline:2px solid white;outline-offset:2px}
    @media(max-height:430px){.champion-picker{gap:3px}.champion-picker select,.champion-picker button{min-height:25px;padding:2px;font-size:10px}.champion-picker label{font-size:8px}}
  `;
  document.head.appendChild(style);
  const wrapper = document.createElement('div');
  wrapper.className = 'champion-picker';
  const label = document.createElement('label');
  label.htmlFor = 'champion-choice';
  label.textContent = 'CHOOSE CHAMPION';
  const select = document.createElement('select');
  select.id = 'champion-choice';
  for (const [value, caption] of options) {
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
  wrapper.append(label,select,start);
  rail.appendChild(wrapper);
})();
