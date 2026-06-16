/* =========================================================
   SALONEEDU CONNECT - MAIN JAVASCRIPT
   Sections:
   1. Helpers and Auth State
   2. Navigation
   3. Login / Register
   4. Protected Actions
   5. Home Slider and Counters
   6. Course Filtering
   7. Dashboard
   8. Floating Quiz and Ask Cisca
========================================================= */

/* ---------- 1. Helpers and Auth State ---------- */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const toast = $('[data-toast]');

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getUser() {
  return storage.get('seUser', null);
}

function isLoggedIn() {
  return Boolean(getUser());
}

function requireLogin(message = 'Please login or register first so this can be saved to your dashboard.') {
  if (isLoggedIn()) return true;
  showToast(message);
  setTimeout(() => {
    window.location.href = `auth.html?next=${encodeURIComponent(location.pathname.split('/').pop() || 'index.html')}`;
  }, 900);
  return false;
}

function updateAuthLinks() {
  const user = getUser();

  // Keep the Login link visible on every page for clear navigation.
  $$('.auth-link').forEach((link) => {
    link.textContent = 'Login';
    link.href = 'auth.html';
  });

  // Show Dashboard as an extra link only after a student has logged in.
  document.body.classList.toggle('is-logged-in', Boolean(user));
  $$('.dashboard-link').forEach((link) => {
    link.hidden = !user;
  });
}

updateAuthLinks();

if (document.body.dataset.protected === 'true' && !isLoggedIn()) {
  showToast('Login first to open your personal student page.');
  setTimeout(() => (window.location.href = 'auth.html'), 900);
}

/* ---------- 2. Navigation ---------- */
const menuToggle = $('.menu-toggle');
const nav = $('.main-nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ---------- 3. Login / Register ---------- */
const loginForm = $('[data-login-form]');
const registerForm = $('[data-register-form]');
const authTabs = $$('[data-auth-tab]');

function showAuthTab(tabName) {
  authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.authTab === tabName));
  loginForm?.classList.toggle('active', tabName === 'login');
  registerForm?.classList.toggle('active', tabName === 'register');
}

authTabs.forEach((tab) => tab.addEventListener('click', () => showAuthTab(tab.dataset.authTab)));
$('[data-switch-register]')?.addEventListener('click', (event) => {
  event.preventDefault();
  showAuthTab('register');
});

$$('[data-show-password]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    $$('[data-password-field]').forEach((field) => {
      field.type = checkbox.checked ? 'text' : 'password';
    });
  });
});

$$('[data-password-field]').forEach((field) => {
  field.addEventListener('input', () => {
    const strengthText = $('[data-strength-text]');
    if (!strengthText) return;
    const value = field.value;
    let strength = 'weak';
    if (value.length >= 8 && /[0-9]/.test(value) && /[A-Z]/.test(value)) strength = 'strong';
    else if (value.length >= 6) strength = 'medium';
    strengthText.textContent = `Password strength: ${value ? strength : 'none'}`;
  });
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  storage.set('seUser', { name: 'Francisca Student', loggedAt: new Date().toISOString() });
  showToast('Login successful. Opening your dashboard...');
  setTimeout(() => (window.location.href = 'dashboard.html'), 900);
});

registerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = registerForm.querySelector('input')?.value || 'New Student';
  storage.set('seUser', { name, loggedAt: new Date().toISOString() });
  showToast('Account created. Your student dashboard is ready.');
  setTimeout(() => (window.location.href = 'dashboard.html'), 900);
});

$('[data-forgot-password]')?.addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Password reset demo: a reset link would be sent to your email or phone.');
});

/* ---------- 4. Protected Actions ---------- */
$$('[data-save-course]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!requireLogin('Login first before saving a course.')) return;
    const course = button.dataset.saveCourse;
    const courses = storage.get('savedCourses', []);
    if (!courses.includes(course)) courses.push(course);
    storage.set('savedCourses', courses);
    showToast(`${course} saved to your dashboard.`);
  });
});

$$('[data-request-tutor]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!requireLogin('Login first before requesting a tutor.')) return;
    const tutor = button.dataset.requestTutor;
    const requests = storage.get('tutorRequests', []);
    requests.push({ tutor, status: 'Pending reply' });
    storage.set('tutorRequests', requests);
    showToast('Tutor request saved as pending.');
  });
});

$$('[data-apply-scholarship]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!requireLogin('Login first before applying for scholarship support.')) return;
    storage.set('selectedScholarship', button.dataset.applyScholarship);
    window.location.href = 'apply.html';
  });
});

$('[data-scholarship-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selected = storage.get('selectedScholarship', 'Scholarship Application');
  storage.set('scholarshipStatus', [{ title: selected, status: 'Pending review', progress: 'Application submitted' }]);
  showToast('Application submitted and saved to dashboard.');
  setTimeout(() => (window.location.href = 'dashboard.html'), 900);
});

$('[data-contact-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  showToast('Message sent. The help desk will contact you soon.');
  event.target.reset();
});

$('[data-search-box]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  showToast('Opening course search...');
  setTimeout(() => (window.location.href = 'courses.html'), 700);
});

/* ---------- 5. Home Slider and Counters ---------- */
const slides = $$('[data-slider] .slide');
const dotsWrap = $('[data-slider-dots]');
let slideIndex = 0;
let slideTimer;

function renderDots() {
  if (!dotsWrap || !slides.length) return;
  dotsWrap.innerHTML = '';
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.addEventListener('click', () => showSlide(index));
    dotsWrap.appendChild(dot);
  });
}

function showSlide(index) {
  if (!slides.length) return;
  slideIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle('active', i === slideIndex));
  $$('button', dotsWrap || document).forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
  clearInterval(slideTimer);
  slideTimer = setInterval(() => showSlide(slideIndex + 1), 5000);
}

if (slides.length) {
  renderDots();
  showSlide(0);
  $('[data-slide-prev]')?.addEventListener('click', () => showSlide(slideIndex - 1));
  $('[data-slide-next]')?.addEventListener('click', () => showSlide(slideIndex + 1));
}

$$('[data-count]').forEach((counter) => {
  const target = Number(counter.dataset.count);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 45));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    counter.textContent = `${current}+`;
  }, 28);
});

/* ---------- 6. Course Filtering ---------- */
const courseFilter = $('[data-course-filter]');
const courseCards = $$('[data-course-list] [data-category]');
let activeCategory = 'all';

function filterCourses() {
  const query = (courseFilter?.value || '').toLowerCase();
  courseCards.forEach((card) => {
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const matchesSearch = card.dataset.title.toLowerCase().includes(query) || card.textContent.toLowerCase().includes(query);
    card.style.display = matchesCategory && matchesSearch ? '' : 'none';
  });
}

courseFilter?.addEventListener('input', filterCourses);
$$('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    $$('[data-filter]').forEach((btn) => btn.classList.toggle('active', btn === button));
    filterCourses();
  });
});

/* ---------- 7. Dashboard ---------- */
const user = getUser();
if (user && $('[data-student-name]')) {
  $('[data-student-name]').textContent = user.name.split(' ')[0] || 'student';
}

function fillList(selector, items, emptyText, formatter = (item) => item) {
  const list = $(selector);
  if (!list) return;
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = `<li>${emptyText}</li>`;
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = formatter(item);
    list.appendChild(li);
  });
}

fillList('[data-saved-courses]', storage.get('savedCourses', []), 'No course saved yet.');
fillList('[data-tutor-requests]', storage.get('tutorRequests', []), 'No tutor request yet.', (item) => `${item.tutor} — <strong>${item.status}</strong>`);
fillList('[data-scholarship-status]', storage.get('scholarshipStatus', []), 'No scholarship application yet.', (item) => `${item.title} — <strong>${item.status}</strong>`);

const tips = [
  'Choose two subjects and study them before opening social media.',
  'After every lesson, write three things you understood and one question.',
  'Use past questions to test yourself, not only to read answers.',
  'Study in short focused sessions and rest before you get tired.',
  'Teach a friend one topic to check if you really understand it.'
];

$('[data-new-tip]')?.addEventListener('click', () => {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  $('[data-daily-tip]').textContent = tip;
});

/* ---------- 8. Floating Quiz and Ask Cisca ---------- */
const quizModal = $('[data-quiz-modal]');
$('[data-open-quiz]')?.addEventListener('click', () => quizModal?.classList.add('open'));
$('[data-close-modal]')?.addEventListener('click', () => quizModal?.classList.remove('open'));

$$('[data-answer]').forEach((button) => {
  button.addEventListener('click', () => {
    const feedback = $('[data-quiz-feedback]');
    if (!feedback) return;
    feedback.textContent = button.dataset.answer === 'correct' ? 'Correct! CSS controls the style of a webpage.' : 'Not quite. The correct answer is CSS.';
  });
});

const chatBox = $('[data-chat-box]');
$('[data-open-chat]')?.addEventListener('click', () => chatBox?.classList.toggle('open'));
$('[data-close-chat]')?.addEventListener('click', () => chatBox?.classList.remove('open'));
