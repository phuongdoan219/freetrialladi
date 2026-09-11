const viewport = document.querySelector('.expert-viewport');
const cards = [...document.querySelectorAll('.expert-card')];
const dots = [...document.querySelectorAll('.carousel-dots button')];
const previousButton = document.querySelector('.carousel-prev');
const nextButton = document.querySelector('.carousel-next');
let currentSlide = 0;

function setActiveDot(index) {
  currentSlide = index;
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
}

function scrollToExpert(index) {
  if (!viewport || !cards.length) return;
  const normalizedIndex = (index + cards.length) % cards.length;
  viewport.scrollTo({ left: cards[normalizedIndex].offsetLeft, behavior: 'smooth' });
  setActiveDot(normalizedIndex);
}

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    scrollToExpert(Number(dot.dataset.target));
  });
});

previousButton?.addEventListener('click', () => scrollToExpert(currentSlide - 1));
nextButton?.addEventListener('click', () => scrollToExpert(currentSlide + 1));

if (viewport && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveDot(Number(visible.target.dataset.slide));
  }, { root: viewport, threshold: [0.55, 0.75] });
  cards.forEach((card) => observer.observe(card));
}

document.querySelector('.registration-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const button = event.currentTarget.querySelector('button');
  button.textContent = 'ĐÃ GỬI THÔNG TIN';
  button.disabled = true;
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.section > .shell, .footer-inner');

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px' });

  revealItems.forEach((item) => {
    item.classList.add('will-reveal');
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
