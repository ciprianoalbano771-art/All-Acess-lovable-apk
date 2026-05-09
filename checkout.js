// ===== Theme =====
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}
setTheme(localStorage.getItem('theme') || 'light');

// ===== Read order from localStorage =====
const currencies = { USD: '$', NGN: '₦', GHS: 'GH₵' };
const order = JSON.parse(localStorage.getItem('checkoutOrder') || '{}');
const months = order.months || 1;
const basePrice = order.price || 5000;
const currency = order.currency || 'NGN';
const sym = currencies[currency] || '₦';

// Populate checkout info
document.getElementById('checkoutTier').textContent = months === 1 ? 'Monthly Subscription' : `${months} Month Bundle`;
document.getElementById('checkoutSubPrice').textContent = `${sym}${basePrice.toLocaleString()}`;
document.getElementById('checkoutTotal').textContent = `${sym}${basePrice.toLocaleString()}`;
document.getElementById('checkoutPayBtn').textContent = `Pay ${sym}${basePrice.toLocaleString()}`;

function getTotal() {
  return basePrice;
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

// ===== Method Picker =====
function toggleMethodPicker() {
  document.getElementById('methodPicker').classList.toggle('hidden');
}

// ===== Purchase Pixel Limiter =====
const NGN_TO_USD = 1500;
const GHS_TO_USD = 14;
let purchasePixelCount = parseInt(sessionStorage.getItem('purchasePixelCount') || '0');

function trackPurchase() {
  if (purchasePixelCount >= 2) return;
  let valueUSD = basePrice;
  if (currency === 'NGN') valueUSD = +(basePrice / NGN_TO_USD).toFixed(2);
  else if (currency === 'GHS') valueUSD = +(basePrice / GHS_TO_USD).toFixed(2);
  fbq('track', 'Purchase', {
    value: valueUSD,
    currency: 'USD',
    content_name: months + ' Month Subscription'
  });
  purchasePixelCount++;
  sessionStorage.setItem('purchasePixelCount', purchasePixelCount);
}

// ===== Transfer Modal =====
let btnTimeout;
let transferAttempts = 0;

function openTransferModal() {
  const total = getTotal();
  document.getElementById('transferAmount').textContent = `${sym}${total.toLocaleString()}`;
  document.getElementById('methodPicker').classList.add('hidden');

  // Reset state
  document.getElementById('confirmTransferBtn').classList.add('hidden');
  document.getElementById('verifyBar').classList.remove('hidden');
  document.getElementById('paymentNotFound').classList.add('hidden');
  transferAttempts = 0;

  startTimer();
  openModal('transferModal');

  // Show button after 60 seconds
  clearTimeout(btnTimeout);
  btnTimeout = setTimeout(() => {
    document.getElementById('verifyBar').classList.add('hidden');
    document.getElementById('confirmTransferBtn').classList.remove('hidden');
  }, 60000);
}

// Timer
let timerInterval;
function startTimer() {
  clearInterval(timerInterval);
  let seconds = 30 * 60;
  const el = document.getElementById('transferTimer');
  timerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) { clearInterval(timerInterval); el.textContent = 'Expired'; return; }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

// Confirm transfer
function confirmTransfer() {
  const btn = document.getElementById('confirmTransferBtn');
  const orig = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span> Verifying...';
  btn.disabled = true;

  transferAttempts++;

  setTimeout(() => {
    btn.textContent = orig;
    btn.disabled = false;

    if (transferAttempts < 2) {
      // First attempt: payment not found
      document.getElementById('paymentNotFound').classList.remove('hidden');
    } else {
      // Second attempt: success
      document.getElementById('paymentNotFound').classList.add('hidden');
      clearInterval(timerInterval);
      clearTimeout(btnTimeout);
      closeModal('transferModal');
      trackPurchase();
      document.getElementById('successMessage').textContent = "You're now subscribed to Asiyami Gold!";
      openModal('successModal');
    }
  }, 2000);
}
