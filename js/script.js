(function () {
  "use strict";

  /* ---------------- Petal field ---------------- */
  var petalField = document.getElementById('petal-field');
  var petalColors = ['#F3B9CB', '#EA95AF', '#F7D9CE'];
  function spawnPetal() {
    var p = document.createElement('div');
    p.className = 'petal';
    var size = 10 + Math.random() * 16;
    var duration = 9 + Math.random() * 9;
    var drift = (30 + Math.random() * 70) * (Math.random() > 0.5 ? 1 : -1);
    var left = Math.random() * 100;
    p.style.left = left + 'vw';
    p.style.width = size + 'px';
    p.style.height = size * 0.75 + 'px';
    p.style.background = petalColors[Math.floor(Math.random() * petalColors.length)];
    p.style.setProperty('--drift', drift + 'px');
    p.style.animationDuration = duration + 's';
    petalField.appendChild(p);
    p.addEventListener('animationend', function () { p.remove(); });
  }
  var petalTimer = setInterval(spawnPetal, 380);
  for (var i = 0; i < 10; i++) { setTimeout(spawnPetal, i * 180); }

  /* ---------------- Setup ---------------- */
  var nickname = 'Pudku';
  var photos = []; // array of object URLs
  var songUrl = null;

  var setupForm = document.getElementById('setup-form');
  var nicknameInput = document.getElementById('nickname-input');
  var photoInput = document.getElementById('photo-input');
  var photoCount = document.getElementById('photo-count');
  var songInput = document.getElementById('song-input');
  var songCount = document.getElementById('song-count');
  var setupScreen = document.getElementById('setup-screen');
  var app = document.getElementById('app');

  photoInput.addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    photoCount.textContent = files.length ? (files.length + ' photo taniyo') : '';
    photos = files.map(function (f) { return URL.createObjectURL(f); });
  });

  songInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (file) {
      songUrl = URL.createObjectURL(file);
      songCount.textContent = file.name;
    } else {
      songUrl = null;
      songCount.textContent = '';
    }
  });

  /* All three fields carry the `required` attribute in the HTML and live
     inside a real <form>. Submitting a form runs the browser's native
     validation first — if the nickname, photos, or song are missing, the
     browser blocks submission and points at the empty/missing field on its
     own, so no extra validation code is needed here. This handler only
     runs once everything required has actually been filled in. */
  setupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = nicknameInput.value.trim();
    if (val) nickname = val;
    document.querySelectorAll('.nickname-slot').forEach(function (el) { el.textContent = nickname; });
    setupScreen.classList.add('hidden');
    app.classList.remove('hidden');
    buildBoard();
    buildCarousel();
    prepareLetters();
    updatePager();
    startMusic();
  });

  /* ---------------- Background song ---------------- */
  var bgAudio = document.getElementById('bg-audio');
  var musicToggle = document.getElementById('music-toggle');
  function startMusic() {
    if (!songUrl) return;
    bgAudio.src = songUrl;
    bgAudio.loop = true;
    bgAudio.volume = 0.55;
    musicToggle.classList.remove('hidden');
    var playPromise = bgAudio.play();
    if (playPromise && playPromise.then) {
      playPromise.then(function () { musicToggle.classList.add('spinning'); })
        .catch(function () { /* autoplay blocked by the browser; the toggle button still works */ });
    }
  }
  musicToggle.addEventListener('click', function () {
    if (bgAudio.paused) {
      bgAudio.play();
      musicToggle.classList.add('spinning');
      musicToggle.querySelector('i').className = 'fa-solid fa-pause';
      musicToggle.setAttribute('aria-label', 'pause song');
    } else {
      bgAudio.pause();
      musicToggle.classList.remove('spinning');
      musicToggle.querySelector('i').className = 'fa-solid fa-play';
      musicToggle.setAttribute('aria-label', 'play song');
    }
  });

  /* ---------------- Page 1: draggable polaroid board ---------------- */
  var captions = ['pyari', 'mutu ko malkin', 'mero khusi ko karan', 'mero maan ko raani', 'mero hridaya ko aasha'];
  function buildBoard() {
    var board = document.getElementById('board');
    var hint = document.getElementById('board-hint');
    board.innerHTML = '';
    if (!photos.length) {
      board.classList.add('board-empty');
      for (var i = 0; i < 3; i++) {
        var ph = document.createElement('div');
        ph.className = 'placeholder-card';
        ph.innerHTML = '<i class="fa-regular fa-image" style="font-size:1.6rem;"></i><span>yeta photo aauncha, chaheko bhaye setup ma thapnus</span>';
        board.appendChild(ph);
      }
      hint.textContent = '';
      return;
    }
    board.classList.remove('board-empty');
    hint.textContent = 'photo haru tanera jaha man lagcha, tyahi rakhnus';
    var boardRect;
    photos.forEach(function (src, idx) {
      var card = document.createElement('div');
      card.className = 'polaroid';
      var startTop = 12 + (idx % 3) * 140;
      var startLeft = 4 + (idx % 4) * 22;
      card.style.top = startTop + 'px';
      card.style.left = startLeft + '%';
      card.style.transform = 'rotate(' + (Math.random() * 14 - 7) + 'deg)';
      card.style.zIndex = idx + 1;
      card.innerHTML = '<div class="tape"></div><img src="' + src + '" alt="uploaded photo" draggable="false">' +
        '<span class="cap">' + captions[idx % captions.length] + '</span>';
      board.appendChild(card);
      makeDraggable(card, board);
    });
  }

  function makeDraggable(el, container) {
    var active = false, offsetX = 0, offsetY = 0, currentRotation = 0;
    el.addEventListener('pointerdown', function (e) {
      active = true;
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
      var rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.style.zIndex = 999;
    });
    el.addEventListener('pointermove', function (e) {
      if (!active) return;
      var cRect = container.getBoundingClientRect();
      var x = e.clientX - cRect.left - offsetX;
      var y = e.clientY - cRect.top - offsetY;
      x = Math.max(-40, Math.min(x, cRect.width - 60));
      y = Math.max(-20, Math.min(y, cRect.height - 40));
      var wobble = Math.sin(Date.now() / 60) * 4;
      el.style.left = (x / cRect.width * 100) + '%';
      el.style.top = y + 'px';
      el.style.transform = 'rotate(' + wobble + 'deg) scale(1.06)';
    });
    function release(e) {
      if (!active) return;
      active = false;
      el.classList.remove('dragging');
      el.style.transform = 'rotate(' + (Math.random() * 10 - 5) + 'deg) scale(1)';
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  /* ---------------- Page 2: carousel ---------------- */
  var carIndex = 0, carTimer = null;
  var quoteFallback = [
    'Timi sanga bitaeko har pal, mero lagi bhandai ramro pal ho.',
    'Kunai din yesto pani hos jaha euta photo matra hoina, sabai kura haru share garna paau.',
    'Timro muskan, mero din ko sab bhanda ramro part ho.'
  ];
  function buildCarousel() {
    var track = document.getElementById('carousel-track');
    var dotsWrap = document.getElementById('carousel-dots');
    track.innerHTML = ''; dotsWrap.innerHTML = '';
    var slides = photos.length ? photos : null;
    var total = photos.length ? photos.length : quoteFallback.length;
    for (var i = 0; i < total; i++) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
      if (slides) {
        slide.innerHTML = '<img src="' + slides[i] + '" alt="memory photo">';
      } else {
        slide.innerHTML = '<div class="quote-card">' + quoteFallback[i] + '</div>';
      }
      track.appendChild(slide);
      var dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dotsWrap.appendChild(dot);
    }
    carIndex = 0;
    resetCarTimer();
  }
  function showSlide(i) {
    var slides = document.querySelectorAll('.carousel-slide');
    var dots = document.querySelectorAll('.carousel-dots span');
    if (!slides.length) return;
    carIndex = (i + slides.length) % slides.length;
    slides.forEach(function (s, idx) { s.classList.toggle('active', idx === carIndex); });
    dots.forEach(function (d, idx) { d.classList.toggle('active', idx === carIndex); });
  }
  function resetCarTimer() {
    if (carTimer) clearInterval(carTimer);
    carTimer = setInterval(function () { showSlide(carIndex + 1); }, 4200);
  }
  document.getElementById('car-prev').addEventListener('click', function () { showSlide(carIndex - 1); resetCarTimer(); });
  document.getElementById('car-next').addEventListener('click', function () { showSlide(carIndex + 1); resetCarTimer(); });

  /* ---------------- Envelope / letter ---------------- */
  var envelopeBtn = document.getElementById('envelope-btn');
  var letterOverlay = document.getElementById('letter-overlay');
  var letterText = document.getElementById('letter-text');
  var letterClose = document.getElementById('letter-close');
  var letterMessages = {};
  function prepareLetters() {
    letterMessages[2] = 'Timro barema sochda, samaye ekchin ko lagi rukeko jasto huncha. Sano kura ho, tara saccho kura ho.';
    letterMessages[3] = 'Tyo harek paal haru yaad xa &mdash; timro muskan, timro awaz, timro chhoto chhoto kurakani haru &mdash; sabai yaad xa.';
    letterMessages[4] = 'Kahile kahi bhanna gaharo huncha, tara aja bhanidinchu: timi sanga hunu paye, thulo bhagya hunx jasto lagcha.';
    letterMessages[5] = 'Yo antim page ho, tara maya antya hudaina. Dherai dherai maya, ' + nickname + '.';
  }
  function openLetter() {
    var pageNum = document.querySelector('.page.active').getAttribute('data-page');
    var msg = letterMessages[pageNum] || letterMessages[2];
    letterText.innerHTML = msg;
    letterOverlay.classList.add('show');
  }
  function closeLetter() { letterOverlay.classList.remove('show'); envelopeBtn.classList.remove('open'); }
  envelopeBtn.addEventListener('click', function () {
    envelopeBtn.classList.add('open');
    setTimeout(openLetter, 260);
  });
  letterClose.addEventListener('click', closeLetter);
  letterOverlay.addEventListener('click', function (e) { if (e.target === letterOverlay) closeLetter(); });

  /* ---------------- Pager ---------------- */
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var current = 0;
  var envelopeWrap = document.getElementById('envelope-wrap');
  var pagerDots = document.getElementById('pager-dots');
  pages.forEach(function () {
    var dot = document.createElement('i');
    dot.className = 'fa-solid fa-circle';
    pagerDots.appendChild(dot);
  });
  function updatePager() {
    pages.forEach(function (p, idx) { p.classList.toggle('active', idx === current); });
    var dots = pagerDots.querySelectorAll('i');
    dots.forEach(function (d, idx) { d.classList.toggle('active', idx === current); });
    document.getElementById('prev-btn').disabled = current === 0;
    document.getElementById('next-btn').disabled = current === pages.length - 1;
    envelopeWrap.classList.toggle('hidden', current === 0);
    closeLetter();
    if (current === 1) resetCarTimer();
  }
  document.getElementById('prev-btn').addEventListener('click', function () { if (current > 0) { current--; updatePager(); } });
  document.getElementById('next-btn').addEventListener('click', function () { if (current < pages.length - 1) { current++; updatePager(); } });
  window.addEventListener('keydown', function (e) {
    if (app.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight' && current < pages.length - 1) { current++; updatePager(); }
    if (e.key === 'ArrowLeft' && current > 0) { current--; updatePager(); }
  });

  /* touch swipe on app (ignore when starting on a polaroid, to not fight drag) */
  var touchStartX = null;
  app.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.polaroid')) { touchStartX = null; return; }
    touchStartX = e.clientX;
  });
  app.addEventListener('pointerup', function (e) {
    if (touchStartX === null) return;
    var dx = e.clientX - touchStartX;
    if (Math.abs(dx) > 70) {
      if (dx < 0 && current < pages.length - 1) { current++; updatePager(); }
      else if (dx > 0 && current > 0) { current--; updatePager(); }
    }
    touchStartX = null;
  });

  /* ---------------- Floating hearts on last page ---------------- */
  var dollStage = document.getElementById('doll-stage');
  function spawnHeart() {
    var h = document.createElement('i');
    h.className = 'fa-solid fa-heart floating-heart';
    h.style.left = (20 + Math.random() * 60) + '%';
    h.style.bottom = '10px';
    h.style.fontSize = (0.7 + Math.random() * 0.6) + 'rem';
    h.style.animationDuration = (4 + Math.random() * 2) + 's';
    dollStage.appendChild(h);
    h.addEventListener('animationend', function () { h.remove(); });
  }
  setInterval(function () {
    if (pages[current] && pages[current].getAttribute('data-page') === '5') spawnHeart();
  }, 700);

})();