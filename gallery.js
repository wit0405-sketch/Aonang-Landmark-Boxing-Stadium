(() => {
  const carousel = document.getElementById('galleryCarousel');
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll('.gallery-item')];
  const filters = [...document.querySelectorAll('[data-gallery]')];
  const dotsBox = document.getElementById('galleryDots');
  const countLabel = document.getElementById('galleryCount');
  const previous = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let category = 'all';
  let current = 0;
  let timer = null;

  const visibleSlides = () => slides.filter(slide => category === 'all' || slide.dataset.category === category);
  const language = () => window.siteLanguage === 'en' ? 'en' : 'th';
  const indexLabel = n => language() === 'en' ? `Show image ${n + 1}` : `ไปยังภาพที่ ${n + 1}`;
  const modulo = (number, total) => total ? (number + total) % total : 0;

  function render() {
    const isEnglish = language() === 'en';
    previous.setAttribute('aria-label', isEnglish ? 'Previous image' : 'ภาพก่อนหน้า');
    next.setAttribute('aria-label', isEnglish ? 'Next image' : 'ภาพถัดไป');
    dotsBox.setAttribute('aria-label', isEnglish ? 'Choose gallery image' : 'เลือกภาพในแกลเลอรี');
    carousel.setAttribute('aria-label', isEnglish ? 'Muay Thai photo gallery' : 'แกลเลอรีภาพมวยไทย');
    const visible = visibleSlides();
    current = modulo(current, visible.length);
    slides.forEach(slide => {
      const active = visible[current] === slide;
      slide.classList.toggle('hidden', !active);
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (active) slide.setAttribute('aria-current', 'true');
      else slide.removeAttribute('aria-current');
    });
    dotsBox.replaceChildren();
    visible.forEach((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', indexLabel(index));
      dot.setAttribute('aria-current', String(index === current));
      dot.addEventListener('click', () => { current = index; render(); restart(); });
      dotsBox.append(dot);
    });
    countLabel.textContent = visible.length ? `${current + 1} / ${visible.length}` : '0 / 0';
    previous.disabled = next.disabled = visible.length < 2;
  }

  function move(amount) {
    current = modulo(current + amount, visibleSlides().length);
    render();
    restart();
  }
  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  function start() {
    stop();
    if (!reduceMotion.matches && visibleSlides().length > 1 && !document.hidden) {
      timer = window.setInterval(() => move(1), 5200);
    }
  }
  function restart() { start(); }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.gallery;
    current = 0;
    filters.forEach(filter => filter.classList.toggle('selected', filter === button));
    render();
    restart();
  }));
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  let touchStart = null;
  carousel.querySelector('.gallery-slides').addEventListener('pointerdown', event => { touchStart = event.clientX; }, {passive:true});
  carousel.querySelector('.gallery-slides').addEventListener('pointerup', event => {
    if (touchStart === null) return;
    const distance = event.clientX - touchStart;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
    touchStart = null;
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduceMotion.addEventListener?.('change', start);
  document.addEventListener('site-language-change', render);

  render();
  start();
})();
