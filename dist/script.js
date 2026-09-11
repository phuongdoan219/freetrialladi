const viewport = document.querySelector('.expert-viewport');
const cards = [...document.querySelectorAll('.expert-card')];
const dots = [...document.querySelectorAll('.carousel-dots button')];

function setActiveDot(index) {
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
}

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const index = Number(dot.dataset.target);
    if (viewport && cards[index]) {
      viewport.scrollTo({ left: cards[index].offsetLeft, behavior: 'smooth' });
    }
    setActiveDot(index);
  });
});

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
