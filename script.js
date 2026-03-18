/* ═══════════════════════════════════════════════════════════
   SWEET DELIGHTS — script.js
   Handles: Categories · Custom Form · Contact Form · UI/UX
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. STATE ───────────────────────────────────────────── */
let qty              = 1;       // quantity counter
let selectedCategory = null;   // currently highlighted card
let modalOccasion    = '';      // passed from category buttons

/* ── 2. INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initNavScrollEffect();
  initBackToTop();
  initSmoothScroll();
  initCustomForm();
  initContactForm();
  setMinDeliveryDate();
  initCharCounter();
});

/* ── 3. SCROLL REVEAL ───────────────────────────────────── */
/**
 * Use IntersectionObserver to animate .reveal elements as they enter the viewport.
 */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── 4. NAVBAR SCROLL EFFECT ────────────────────────────── */
/**
 * Add/remove 'scrolled' class on the navbar based on scroll position.
 */
function initNavScrollEffect() {
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── 5. BACK TO TOP ─────────────────────────────────────── */
/**
 * Toggle visibility of the back-to-top button.
 */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
}

/**
 * Scroll the page smoothly to the top.
 */
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── 6. SMOOTH SCROLLING ────────────────────────────────── */
/**
 * Intercept anchor links and smooth-scroll with navbar offset.
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();

      const navHeight = document.getElementById('mainNav').offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile nav
      const collapse = bootstrap.Collapse.getInstance(document.getElementById('navMenu'));
      if (collapse) collapse.hide();
    });
  });
}

/* ── 7. CATEGORY SELECTION ──────────────────────────────── */
/**
 * Highlight the clicked cake category card and deselect others.
 * @param {HTMLElement} card - The clicked .cake-card element
 */
function selectCategory(card) {
  const allCards = document.querySelectorAll('.cake-card');

  if (selectedCategory === card) {
    // Deselect if clicking the same card again
    card.classList.remove('selected');
    selectedCategory = null;
    return;
  }

  allCards.forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedCategory = card;

  // Pre-fill the occasion in the custom form
  const cat = card.dataset.category;
  const occasionMap = {
    birthday:    'Birthday',
    wedding:     'Wedding',
    anniversary: 'Anniversary',
    face:        'Face Cake',
  };
  const sel = document.getElementById('occasion');
  if (sel && occasionMap[cat]) {
    sel.value = occasionMap[cat];
    clearFieldError('occasion', 'occasionErr');
  }

  // Pulse the custom section CTA
  showToast(`🎂 ${card.querySelector('.cake-tag').textContent} selected! Scroll to customise.`);
}

/* ── 8. OPEN QUICK MODAL ────────────────────────────────── */
/**
 * Open the quick-customise modal pre-filled with the occasion.
 * @param {string} occasion - e.g. 'Birthday'
 */
function openCustomModal(occasion) {
  modalOccasion = occasion;

  document.getElementById('quickModalTitle').textContent = `Customise — ${occasion}`;
  document.getElementById('quickModalSub').textContent =
    `Occasion "${occasion}" pre-selected. Choose your preferences below.`;

  const modal = new bootstrap.Modal(document.getElementById('quickModal'));
  modal.show();
}

/**
 * "Confirm & Customise" in the quick modal — pre-fills main custom form and scrolls to it.
 */
function confirmModal() {
  // Pre-fill occasion in main form
  const sel = document.getElementById('occasion');
  if (sel) sel.value = modalOccasion;

  // Pre-fill flavor
  const modalFlavor = document.getElementById('modalFlavor').value;
  const flavorSel   = document.getElementById('flavor');
  if (flavorSel) flavorSel.value = modalFlavor;

  // Pre-fill message
  const modalMsg = document.getElementById('modalMsg').value;
  const cakeMsg  = document.getElementById('cakeMsg');
  if (cakeMsg && modalMsg) {
    cakeMsg.value = modalMsg;
    updateCharCount(modalMsg.length);
  }

  updateSummary();

  // Close modal then scroll
  bootstrap.Modal.getInstance(document.getElementById('quickModal')).hide();
  setTimeout(() => {
    const target = document.getElementById('custom');
    const navH   = document.getElementById('mainNav').offsetHeight;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
  }, 350);
}

/* ── 9. QUANTITY CONTROL ────────────────────────────────── */
/**
 * Increment or decrement the cake quantity.
 * @param {number} delta - +1 or -1
 */
function changeQty(delta) {
  qty = Math.max(1, Math.min(20, qty + delta));
  document.getElementById('qtyDisplay').textContent = qty;
  updateSummary();
}

/* ── 10. ORDER SUMMARY ──────────────────────────────────── */
/**
 * Rebuild the live order summary card based on current form selections.
 */
function updateSummary() {
  const flavor    = document.getElementById('flavor')?.value   || '';
  const sizeEl    = document.getElementById('cakeSize');
  const icing     = document.getElementById('icing')?.value    || '';
  const cakeMsg   = document.getElementById('cakeMsg')?.value  || '';

  if (!flavor || !sizeEl?.value) {
    document.getElementById('orderSummary').style.display = 'none';
    return;
  }

  // Get price from selected option's data attribute
  const selectedOpt = sizeEl.options[sizeEl.selectedIndex];
  const unitPrice   = parseInt(selectedOpt?.dataset?.price || 0, 10);
  const total       = unitPrice * qty;

  const content = `
    <div class="summary-line"><span>Flavour</span><strong>${flavor}</strong></div>
    <div class="summary-line"><span>Size</span><strong>${sizeEl.value}</strong></div>
    <div class="summary-line"><span>Icing</span><strong>${icing}</strong></div>
    ${cakeMsg ? `<div class="summary-line"><span>Message</span><strong>"${cakeMsg}"</strong></div>` : ''}
    <div class="summary-line"><span>Quantity</span><strong>${qty}</strong></div>
  `;

  document.getElementById('summaryContent').innerHTML = content;
  document.getElementById('summaryTotal').textContent  = `Total: ₹${total.toLocaleString('en-IN')}`;
  document.getElementById('orderSummary').style.display = '';
}

/* ── 11. CHARACTER COUNTER ──────────────────────────────── */
function initCharCounter() {
  const input = document.getElementById('cakeMsg');
  if (input) {
    input.addEventListener('input', () => updateCharCount(input.value.length));
  }
}
function updateCharCount(len) {
  const counter = document.getElementById('charCount');
  if (counter) counter.textContent = `${len} / 40 characters`;
}

/* ── 12. SET MIN DELIVERY DATE ──────────────────────────── */
/**
 * Prevent past dates from being selectable in the delivery date field.
 */
function setMinDeliveryDate() {
  const field = document.getElementById('delivDate');
  if (!field) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  field.min = tomorrow.toISOString().split('T')[0];
}

/* ── 13. CUSTOM FORM VALIDATION & SUBMIT ────────────────── */
function initCustomForm() {
  const form = document.getElementById('customForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (validateCustomForm()) submitCustomForm();
  });

  // Live validation clearance
  ['occasion', 'flavor', 'cakeSize', 'delivDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => clearFieldError(id, id + 'Err'));
  });
}

/**
 * Validate all required fields in the custom cake form.
 * @returns {boolean}
 */
function validateCustomForm() {
  let valid = true;

  if (!document.getElementById('occasion').value) {
    showFieldError('occasion', 'occasionErr'); valid = false;
  }
  if (!document.getElementById('flavor').value) {
    showFieldError('flavor', 'flavorErr'); valid = false;
  }
  if (!document.getElementById('cakeSize').value) {
    showFieldError('cakeSize', 'sizeErr'); valid = false;
  }
  if (!document.getElementById('delivDate').value) {
    showFieldError('delivDate', 'dateErr'); valid = false;
  }

  return valid;
}

/**
 * Simulate the custom form submission with a loading state.
 */
function submitCustomForm() {
  const btn     = document.getElementById('customSubmitBtn');
  const text    = document.getElementById('customBtnText');
  const spinner = document.getElementById('customBtnSpinner');

  btn.disabled       = true;
  text.style.display = 'none';
  spinner.style.display = '';

  setTimeout(() => {
    btn.disabled         = false;
    text.style.display   = '';
    spinner.style.display = 'none';

    // Show summary toast
    const flavor = document.getElementById('flavor').value;
    const size   = document.getElementById('cakeSize').value;
    showToast(`✅ ${flavor} (${size}) added! Complete your order below.`);

    // Scroll to contact form
    const target = document.getElementById('contact');
    const navH   = document.getElementById('mainNav').offsetHeight;
    window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });

    // Pre-populate occasion in contact form
    const occ = document.getElementById('occasion').value;
    const contactOcc = document.getElementById('cOccasion');
    if (occ && contactOcc) {
      for (let i = 0; i < contactOcc.options.length; i++) {
        if (contactOcc.options[i].text.includes(occ)) {
          contactOcc.selectedIndex = i;
          break;
        }
      }
    }

    // Pre-populate message
    const msg  = document.getElementById('cakeMsg').value;
    const spec = document.getElementById('specNotes').value;
    const cMsg = document.getElementById('cMessage');
    if (cMsg) cMsg.value = [msg, spec].filter(Boolean).join(' | ');

  }, 1500);
}

/* ── 14. CONTACT FORM VALIDATION & SUBMIT ───────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (validateContactForm()) submitContactForm();
  });

  // Live clear on input/change
  const fieldMap = {
    cName: 'cNameErr',
    cEmail: 'cEmailErr',
    cPhone: 'cPhoneErr',
    cOccasion: 'cOccasionErr',
    cAddress: 'cAddressErr',
  };
  Object.entries(fieldMap).forEach(([fieldId, errId]) => {
    document.getElementById(fieldId)?.addEventListener('input', () => clearFieldError(fieldId, errId));
    document.getElementById(fieldId)?.addEventListener('change', () => clearFieldError(fieldId, errId));
  });
}

/**
 * Validate all required contact form fields.
 * @returns {boolean}
 */
function validateContactForm() {
  let valid = true;

  // Name
  const name = document.getElementById('cName').value.trim();
  if (name.length < 2) { showFieldError('cName', 'cNameErr'); valid = false; }

  // Email
  const email = document.getElementById('cEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('cEmail', 'cEmailErr'); valid = false; }

  // Phone — 10–13 digits, optional spaces/+/dash
  const phone = document.getElementById('cPhone').value.trim().replace(/[\s\-\+\(\)]/g, '');
  if (!/^\d{10,13}$/.test(phone)) { showFieldError('cPhone', 'cPhoneErr'); valid = false; }

  // Occasion
  if (!document.getElementById('cOccasion').value) { showFieldError('cOccasion', 'cOccasionErr'); valid = false; }

  // Address
  const addr = document.getElementById('cAddress').value.trim();
  if (addr.length < 5) { showFieldError('cAddress', 'cAddressErr'); valid = false; }

  return valid;
}

/**
 * Simulate the contact form submit.
 */
function submitContactForm() {
  const btn     = document.getElementById('contactSubmitBtn');
  const text    = document.getElementById('contactBtnText');
  const spinner = document.getElementById('contactBtnSpinner');

  btn.disabled         = true;
  text.style.display   = 'none';
  spinner.style.display = '';

  setTimeout(() => {
    btn.disabled         = false;
    text.style.display   = '';
    spinner.style.display = 'none';

    // Show success alert
    document.getElementById('contactForm').style.display  = 'none';
    document.getElementById('contactSuccess').style.display = '';

    // Reset after 7s
    setTimeout(() => {
      document.getElementById('contactForm').reset();
      document.getElementById('contactForm').style.display = '';
      document.getElementById('contactSuccess').style.display = 'none';
    }, 7000);
  }, 1800);
}

/* ── 15. SHARED VALIDATION HELPERS ─────────────────────── */
/**
 * Mark a field as invalid and show its associated error message.
 * @param {string} fieldId
 * @param {string} errId
 */
function showFieldError(fieldId, errId) {
  document.getElementById(fieldId)?.classList.add('is-invalid');
  document.getElementById(errId)?.classList.add('show');
}

/**
 * Clear error state from a field.
 * @param {string} fieldId
 * @param {string} errId
 */
function clearFieldError(fieldId, errId) {
  document.getElementById(fieldId)?.classList.remove('is-invalid');
  document.getElementById(errId)?.classList.remove('show');
}

/* ── 16. TOAST NOTIFICATION ─────────────────────────────── */
/**
 * Display a brief toast notification.
 * @param {string} message
 */
function showToast(message) {
  const toastEl = document.getElementById('mainToast');
  document.getElementById('toastMsg').textContent = message;
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
  toast.show();
}