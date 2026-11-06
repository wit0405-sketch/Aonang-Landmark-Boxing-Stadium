const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav-link, .main-nav a, .brand').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  });
}, {rootMargin: '-35% 0px -55% 0px'});
sections.forEach(section => observer.observe(section));

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    const filter = button.dataset.filter;
    document.querySelectorAll('.schedule-row[data-type]').forEach(row => {
      row.classList.toggle('hidden', filter !== 'all' && row.dataset.type !== filter);
    });
  });
});
document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-gallery]').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    const filter = button.dataset.gallery;
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
    });
  });
});
document.getElementById('contactForm')?.addEventListener('submit', event => {
  event.preventDefault();
  document.getElementById('formNote').textContent = window.siteLanguage === 'en'
    ? 'Thank you for your message! This sample form needs a messaging service before it can be used.'
    :
    'ขอบคุณสำหรับข้อความ! แบบฟอร์มนี้ยังเป็นตัวอย่าง โปรดเชื่อมต่อระบบรับข้อความก่อนเปิดใช้งานจริง';
});
document.getElementById('year').textContent = new Date().getFullYear();
