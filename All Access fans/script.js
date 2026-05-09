// ===== Theme =====
const themeToggle = document.getElementById('themeToggle');
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});
setTheme(localStorage.getItem('theme') || 'light');

// ===== Currency Toggle =====
const currencies = { USD: '$', NGN: '₦', GHS: 'GH₵' };
let currentCurrency = 'NGN';

document.querySelectorAll('.currency-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCurrency = btn.dataset.currency;
    updatePrices();
  });
});

function getDatasetKey() {
  const c = currentCurrency.toLowerCase();
  return 'price' + c.charAt(0).toUpperCase() + c.slice(1);
}

function updatePrices() {
  const sym = currencies[currentCurrency];
  const key = getDatasetKey();

  document.querySelectorAll('.bundle').forEach(b => {
    const price = b.dataset[key];
    if (price) {
      b.querySelector('.bundle-price').textContent = `${sym}${Number(price).toLocaleString()}`;
    }
  });

  // Update subscribe button with active bundle price
  const activeBundle = document.querySelector('.bundle.active');
  if (activeBundle) {
    const price = activeBundle.dataset[key];
    selectedBundle.price = Number(price);
    document.getElementById('subscribeBtn').textContent = `SUBSCRIBE FOR ${sym}${Number(price).toLocaleString()}`;
  }
}

// ===== Bundle Selection =====
let selectedBundle = { months: 1, price: 5000 };

document.querySelectorAll('.bundle').forEach(bundle => {
  bundle.addEventListener('click', () => {
    document.querySelectorAll('.bundle').forEach(b => b.classList.remove('active'));
    bundle.classList.add('active');

    const key = getDatasetKey();
    const price = Number(bundle.dataset[key]);
    const months = Number(bundle.dataset.months);
    selectedBundle = { months, price };

    const sym = currencies[currentCurrency];
    document.getElementById('subscribeBtn').textContent = `SUBSCRIBE FOR ${sym}${price.toLocaleString()}`;
  });
});

// ===== Tabs =====
const tabs = document.querySelectorAll('.tab');
const posts = document.querySelectorAll('.post');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const f = tab.dataset.tab;
    posts.forEach(p => {
      if (f === 'all') p.classList.remove('hidden');
      else if (f === 'locked') p.classList.toggle('hidden', !p.classList.contains('locked'));
      else p.classList.toggle('hidden', p.dataset.type !== f);
    });
  });
});

// ===== Likes =====
function toggleLike(btn) {
  btn.classList.toggle('liked');
  const s = btn.querySelector('span');
  let n = parseInt(s.textContent.replace(/,/g, ''));
  n += btn.classList.contains('liked') ? 1 : -1;
  s.textContent = n.toLocaleString();
}

// ===== Copy =====
function copyAccount(el) {
  const text = el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    el.classList.add('copied');
    const orig = el.textContent;
    el.textContent = 'Copied!';
    setTimeout(() => { el.classList.remove('copied'); el.textContent = orig; }, 1500);
  });
}

// ===== Modals =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('click', e => {
    if (e.target === bg) { bg.classList.remove('active'); document.body.style.overflow = ''; }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-bg.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// ===== Subscribe / Checkout =====
document.getElementById('subscribeBtn').addEventListener('click', () => {
  goToCheckout();
});

function scrollToSubscribe() {
  fbq('track', 'ViewContent', { content_name: 'Locked Post' });
  document.querySelector('.subscribe-section').scrollIntoView({ behavior: 'smooth' });
}

function goToCheckout() {
  const sym = currencies[currentCurrency];
  fbq('track', 'InitiateCheckout', {
    value: selectedBundle.price,
    currency: currentCurrency,
    content_name: selectedBundle.months + ' Month Subscription'
  });
  localStorage.setItem('checkoutOrder', JSON.stringify({
    months: selectedBundle.months,
    price: selectedBundle.price,
    currency: currentCurrency
  }));
  window.location.href = 'checkout.html';
}

// Unlock posts (called when returning from successful checkout)
function unlockPosts() {
  posts.forEach(post => {
    if (post.classList.contains('locked')) {
      post.classList.remove('locked');
      const ov = post.querySelector('.lock-wall');
      const bl = post.querySelector('.post-img.blurred');
      if (ov) ov.remove();
      if (bl) bl.classList.remove('blurred');
    }
  });
}

// ===== Tip =====
let tipAmount = 2000;

function openTip() { openModal('tipModal'); }

function selectTip(amount, btn) {
  tipAmount = amount;
  document.querySelectorAll('.tip-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('customTip').value = '';
  document.getElementById('tipPayBtn').textContent = `Send ₦${tipAmount.toLocaleString()} Tip`;
}

document.getElementById('customTip').addEventListener('input', e => {
  const v = parseInt(e.target.value);
  if (v >= 500) {
    tipAmount = v;
    document.querySelectorAll('.tip-chip').forEach(b => b.classList.remove('active'));
    document.getElementById('tipPayBtn').textContent = `Send ₦${tipAmount.toLocaleString()} Tip`;
  }
});

let tipBtnTimeout;
let tipTransferAttempts = 0;

function sendTip() {
  closeModal('tipModal');
  document.getElementById('tipTransferAmount').textContent = `₦${tipAmount.toLocaleString()}`;

  // Reset state
  document.getElementById('confirmTipTransferBtn').classList.add('hidden');
  document.getElementById('tipVerifyBar').classList.remove('hidden');
  document.getElementById('tipPaymentNotFound').classList.add('hidden');
  tipTransferAttempts = 0;

  startTipTimer();
  openModal('tipTransferModal');

  // Show button after 60 seconds
  clearTimeout(tipBtnTimeout);
  tipBtnTimeout = setTimeout(() => {
    document.getElementById('tipVerifyBar').classList.add('hidden');
    document.getElementById('confirmTipTransferBtn').classList.remove('hidden');
  }, 60000);
}

// Tip transfer timer
let tipTimerInterval;
function startTipTimer() {
  clearInterval(tipTimerInterval);
  let seconds = 30 * 60;
  const el = document.getElementById('tipTransferTimer');
  tipTimerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) { clearInterval(tipTimerInterval); el.textContent = 'Expired'; return; }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function confirmTipTransfer() {
  const btn = document.getElementById('confirmTipTransferBtn');
  const orig = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span> Verifying...';
  btn.disabled = true;

  tipTransferAttempts++;

  setTimeout(() => {
    btn.textContent = orig; btn.disabled = false;

    if (tipTransferAttempts < 2) {
      // First attempt: payment not found
      document.getElementById('tipPaymentNotFound').classList.remove('hidden');
    } else {
      // Second attempt: success
      document.getElementById('tipPaymentNotFound').classList.add('hidden');
      clearInterval(tipTimerInterval);
      clearTimeout(tipBtnTimeout);
      closeModal('tipTransferModal');
      fbq('track', 'Lead', {
        value: tipAmount,
        currency: 'NGN',
        content_name: 'Tip'
      });
      document.getElementById('successMessage').textContent = `₦${tipAmount.toLocaleString()} tip sent to Asiyami Gold!`;
      openModal('successModal');
    }
  }, 2000);
}

// ===== Play Video =====
function playVideo(container, src) {
  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style.width = '100%';
  video.style.display = 'block';
  video.style.borderRadius = 'inherit';
  container.innerHTML = '';
  container.classList.remove('video-thumb');
  container.appendChild(video);
}

// ===== ViewContent for locked posts =====
document.querySelectorAll('.post.locked').forEach(post => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fbq('track', 'ViewContent', { content_name: 'Locked Post' });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(post);
});

// ===== PPV (redirects to checkout) =====
function openPPV(btn, price) {
  goToCheckout();
}

