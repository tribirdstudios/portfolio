// Sticky header: highlights the section you're on (home page only) and the year in the footer.
(function () {
  var header = document.querySelector('header.site');
  var box = header.querySelector('.links');
  var pill = box.querySelector('.pill');
  // Only links that point at a section on this page take part in the highlight.
  var links = Array.prototype.slice.call(box.querySelectorAll('ul a')).filter(function (a) {
    return a.getAttribute('href').charAt(0) === '#';
  });
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var current = null;

  function place(a) {
    if (!a) { pill.style.opacity = 0; return; }
    pill.style.width = a.offsetWidth + 'px';
    pill.style.height = a.offsetHeight + 'px';
    pill.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    pill.style.backgroundColor = 'var(' + a.dataset.c + ')';
    pill.style.opacity = 1;
  }

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 8);
    if (!links.length) return;
    var line = window.innerHeight * 0.35, idx = -1;
    sections.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = links.length - 1;
    var a = idx >= 0 ? links[idx] : null;
    if (a === current) return;
    if (current) { current.classList.remove('active'); current.removeAttribute('aria-current'); }
    current = a;
    if (a) {
      a.classList.add('active'); a.setAttribute('aria-current', 'true');
      if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    }
    place(a);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
  }, { passive: true });
  window.addEventListener('resize', function () { place(current); update(); });
  if (document.fonts) document.fonts.ready.then(function () { place(current); });
  update();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
