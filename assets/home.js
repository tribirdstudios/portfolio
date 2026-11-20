// Home page only: commission form and the music player tabs.
(function () {
  var form = document.getElementById('commission-form');
  var status = form.querySelector('.cform-status');
  var btn = form.querySelector('button[type="submit"]');
  var type = form.querySelector('[name="project_type"]');
  var gameFields = form.querySelector('.game-only');
  var email = form.dataset.email || 'hello@tribirdstudios.com';
  function syncGame() { gameFields.hidden = type.value !== 'Video game'; }
  type.addEventListener('change', syncGame);
  try {
    var ref = new URLSearchParams(location.search).get('ref');
    form.querySelector('[name="source_ref"]').value = ref || (document.referrer ? new URL(document.referrer).hostname : 'direct');
  } catch (e) {}
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Sending…';
    status.className = 'cform-status'; status.textContent = '';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset(); syncGame();
        status.className = 'cform-status ok';
        status.textContent = 'Thanks, I’ve got it. I’ll reply personally within a few days. If it’s urgent, email ' + email + '.';
      })
      .catch(function () {
        status.className = 'cform-status err';
        status.textContent = 'Something went wrong. Please try again, or email ' + email + '.';
      })
      .then(function () { btn.disabled = false; btn.textContent = 'Send request'; });
  });
})();

(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.player-tabs [role="tab"]'));
  if (!tabs.length) return;
  function show(t) {
    tabs.forEach(function (o) {
      var on = o === t;
      o.setAttribute('aria-selected', on ? 'true' : 'false');
      o.tabIndex = on ? 0 : -1;
      document.getElementById(o.getAttribute('aria-controls')).hidden = !on;
    });
    var f = document.getElementById(t.getAttribute('aria-controls')).querySelector('iframe[data-src]');
    if (f) { f.src = f.getAttribute('data-src'); f.removeAttribute('data-src'); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); show(n);
    });
  });
})();
