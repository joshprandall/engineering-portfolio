/* Portfolio integration: repair the shared menu and restore the original qubit demo. */
(() => {
  const nav = document.querySelector('header nav[aria-label="Primary"]');
  const menu = document.querySelector('#menu');
  if (nav && menu) {
    nav.id ||= 'primary-nav';
    menu.setAttribute('aria-controls', nav.id);
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const slider = document.getElementById('theta');
  if (!slider) return;
  const element = id => document.getElementById(id);
  function render() {
    const theta = Number(slider.value);
    if (!Number.isFinite(theta)) return;
    const p0 = Math.cos(theta * Math.PI / 360) ** 2;
    const p1 = 1 - p0;
    element('angle').textContent = `${theta}°`;
    element('p0').textContent = `${(100*p0).toFixed(1)}%`;
    element('p1').textContent = `${(100*p1).toFixed(1)}%`;
    element('bar0').style.width = `${100*p0}%`;
    element('bar1').style.width = `${100*p1}%`;
    element('state-description').textContent = theta===0 ? 'Certain outcome |0⟩ in this basis.' : theta===180 ? 'Certain outcome |1⟩ in this basis.' : theta===90 ? 'Equal probabilities for the two measurement outcomes.' : 'The angle changes the computational-basis measurement probabilities.';
  }
  slider.addEventListener('input',render);
  document.querySelectorAll('[data-angle]').forEach(button => button.addEventListener('click', () => {
    slider.value = button.dataset.angle; render();
  }));
  element('measure')?.addEventListener('click', () => {
    const p0 = Math.cos(Number(slider.value) * Math.PI / 360) ** 2;
    let zeros = 0;
    for (let i=0; i<100; i++) if (Math.random() < p0) zeros++;
    element('sample-result').textContent = `100 simulated measurements: |0⟩ ${zeros}, |1⟩ ${100-zeros}. Results vary by sampling.`;
  });
  render();
})();
