// Header pill, footer year, "Everything else" panel, and the commission form.
(function () {
  var header = document.querySelector('header.site');
  var box = header.querySelector('.links');
  var pill = box.querySelector('.pill');
  var a = box.querySelector('a.active');
  function place() {
    if (!a) return;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.height = a.offsetHeight + 'px';
    pill.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    pill.style.backgroundColor = 'var(' + a.dataset.c + ')';
    pill.style.opacity = 1;
  }
  function scrolled() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', scrolled, { passive: true });
  window.addEventListener('resize', place);
  if (document.fonts) document.fonts.ready.then(place);
  place(); scrolled();
  if (a && box.scrollWidth > box.clientWidth) box.scrollLeft = a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2;
})();

(function () {
  var more = document.querySelector('details.more');
  function check() { if (location.hash === '#more' && more) more.open = true; }
  addEventListener('hashchange', check); check();
})();

(function () {
  var form = document.getElementById('brief-form');
  if (!form) return;
  var email = form.dataset.email || 'hello@tribirdstudios.com';
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');
  try {
    var ref = new URLSearchParams(location.search).get('ref');
    form.elements.source_ref.value = ref || (document.referrer ? new URL(document.referrer).hostname : 'direct');
  } catch (e) {}
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    btn.disabled = true; btn.textContent = 'Sending…';
    status.className = 'form-status'; status.textContent = '';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error();
        form.reset();
        status.className = 'form-status ok';
        status.textContent = 'Thanks, I’ve got it. I’ll reply personally within two days. If it’s urgent, email ' + email + '.';
      })
      .catch(function () {
        status.className = 'form-status err';
        status.textContent = 'Something went wrong. Please try again, or email ' + email + '.';
      })
      .then(function () { btn.disabled = false; btn.textContent = 'Send request'; });
  });
})();

var y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
