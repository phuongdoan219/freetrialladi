const viewport = document.querySelector('.expert-viewport');
const cards = [...document.querySelectorAll('.expert-card')];
const dots = [...document.querySelectorAll('.carousel-dots button')];
const previousButton = document.querySelector('.carousel-prev');
const nextButton = document.querySelector('.carousel-next');
const successDialog = document.querySelector('#success-dialog');
const closeSuccessButton = document.querySelector('[data-close-success]');
let currentSlide = 0;

function closeSuccessDialog() {
  successDialog?.close();
}

closeSuccessButton?.addEventListener('click', closeSuccessDialog);
successDialog?.addEventListener('click', (event) => {
  if (event.target === successDialog) closeSuccessDialog();
});

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

document.querySelector('.registration-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;

  const form = event.currentTarget;
  const formData = new FormData(form);
  const button = form.querySelector('button[type="submit"]');
  const originalButtonContent = button.innerHTML;
  const eventId = window.crypto?.randomUUID?.() || `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const params = new URLSearchParams(window.location.search);

  button.disabled = true;
  button.textContent = 'ĐANG GỬI...';

  try {
    const leadResponse = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: formData.get('parentName'),
        phone: formData.get('phone'),
        childAge: formData.get('childAge'),
        concern: formData.get('concern'),
        commitment: formData.get('commitment') === 'on',
        landingPage: window.location.href,
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        target: params.get('target') || params.get('utm_term') || '',
        camp: params.get('camp') || params.get('utm_id') || '',
        mkt: params.get('mkt') || '',
        content: params.get('content') || params.get('utm_content') || '',
      }),
    });

    if (!leadResponse.ok) throw new Error('Lead submission failed');

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {}, { eventID: eventId });
    }

    fetch('/api/meta-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventId,
        parentName: formData.get('parentName'),
        phone: formData.get('phone'),
        eventSourceUrl: window.location.href,
      }),
    }).catch((error) => console.warn('Không thể gửi sự kiện Conversions API.', error));

    form.reset();
    button.innerHTML = originalButtonContent;
    button.disabled = false;

    if (successDialog?.showModal) {
      successDialog.showModal();
    } else {
      window.alert('Đăng ký thành công! TeenCare sẽ sớm liên hệ với ba mẹ để trao đổi và đặt lịch tư vấn 1:1 phù hợp.');
    }
  } catch (error) {
    console.error('Không thể lưu thông tin đăng ký.', error);
    button.innerHTML = originalButtonContent;
    button.disabled = false;
    window.alert('Chưa thể gửi thông tin. Ba mẹ vui lòng thử lại sau ít phút.');
  }
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
