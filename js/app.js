import { StorageManager } from './core/storage.js';
import { ParticleSystem } from './core/particles.js';
import { AnimationSystem } from './systems/animations.js';
import { LoadingController } from './core/loader.js';
import { WireframeAsteroid } from './core/wireframeAsteroid.js';
import { VectorGameObjects } from './core/vectorGameObjects.js';
import { SVGHelper } from './core/svgHelper.js';

// Debug logging flag - set to false for production
const DEBUG = false;

if (DEBUG) console.log('[app.js] Module loaded');

class SpaceLanesApp {
  constructor() {
    if (DEBUG) console.log('[SpaceLanesApp] Constructor called');
    this.storage = new StorageManager();
    this.currentPage = this.getCurrentPage();
    if (DEBUG) console.log('[SpaceLanesApp] Current page:', this.currentPage);
    this.user = this.storage.getCurrentUser();
    if (DEBUG) console.log('[SpaceLanesApp] Current user:', this.user ? this.user.username : 'None');
    this.init();
  }
  
  init() {
    if (DEBUG) console.log('[SpaceLanesApp] Initializing...');
    // SVG icons are auto-loaded by svgHelper.js on import
    
    // Add loading spinner to loading screen
    this.setupLoadingSpinner();
    
    // Initialize particle system on all pages
    if (DEBUG) console.log('[SpaceLanesApp] Initializing particle system...');
    new ParticleSystem('particle-canvas');
    
    // Initialize loading screen on home page
    if (this.currentPage === 'home') {
      if (DEBUG) console.log('[SpaceLanesApp] Home page detected - initializing loading controller');
      new LoadingController();
      
      // Initialize wireframe asteroid and animations after loading completes
      document.addEventListener('app:loaded', () => {
        if (DEBUG) console.log('[SpaceLanesApp] App loaded event received');
        setTimeout(() => {
          if (DEBUG) console.log('[SpaceLanesApp] Creating wireframe asteroid and animation system');
          new WireframeAsteroid('asteroidContainer', {
            size: 400,
            segments: 12,
            irregularity: 0.45,
            rotationSpeed: 0.4
          });
          new AnimationSystem();
        }, 100);
      });
    }
    
    // Page Visibility API - Pause particles when tab is hidden
    if (DEBUG) console.log('[SpaceLanesApp] Setting up page visibility handling');
    this.setupPageVisibility();
    
    if (DEBUG) console.log('[SpaceLanesApp] Setting up auth, navigation, and carousel');
    this.setupAuth();
    this.setupNavigation();
    this.setupCarousel();
    this.checkAuthState();
    if (DEBUG) console.log('[SpaceLanesApp] Initialization complete');
    
    if (this.currentPage === 'rankings') {
      this.setupRankingsPage();
    }
    
    if (this.currentPage === 'login') {
      this.setupLoginPage();
    }
    
    if (this.currentPage === 'register') {
      this.setupRegisterPage();
    }
  }
  
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('login')) return 'login';
    if (path.includes('register')) return 'register';
    if (path.includes('game')) return 'game';
    if (path.includes('rankings')) return 'rankings';
    return 'home';
  }
  
  setupAuth() {
    if (this.currentPage === 'login' || this.currentPage === 'register') {
      return;
    }
    
    const navButtons = document.querySelectorAll('[data-auth]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.auth;
        if (action === 'logout') {
          this.logout();
        }
      });
    });
  }
  
  setupNavigation() {
    const navRoot = document.querySelector('.main-nav') || document.querySelector('.nav-header');
    if (!navRoot) return;

    if (this.user) {
      this.updateNavForLoggedInUser();
    }

    const navLinks = navRoot.querySelectorAll('.nav-links .nav-link');
    const pageToHref = {
      home: 'index.html',
      game: 'game.html',
      rankings: 'rankings.html'
    };
    const activeFragment = pageToHref[this.currentPage];
    if (activeFragment) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href && href.includes(activeFragment);
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navRoot.classList.add('scrolled');
      } else {
        navRoot.classList.remove('scrolled');
      }
    });
  }
  
  setupLoadingSpinner() {
    const spinnerContainer = document.getElementById('loadingSpinner');
    if (spinnerContainer) {
      const spinner = VectorGameObjects.createLoadingSpinner(60, '#00f0ff');
      spinnerContainer.appendChild(spinner);
    }
  }
  
  setupPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause animations when tab is hidden
        if (window.particleSystem) {
          window.particleSystem.pause();
        }
      } else {
        // Resume animations when tab is visible
        if (window.particleSystem) {
          window.particleSystem.resume();
        }
      }
    });
  }
  
  setupCarousel() {
    if (DEBUG) console.log('[SpaceLanesApp] setupCarousel called');
    if (this.currentPage !== 'home') {
      if (DEBUG) console.log('[SpaceLanesApp] Not home page, skipping carousel setup');
      return;
    }
    
    const track = document.querySelector('.carousel-track');
    const wrapper = document.querySelector('.carousel-wrapper');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    if (!track || !prevBtn || !nextBtn || !indicatorsContainer) {
      if (DEBUG) console.warn('[SpaceLanesApp] Carousel elements not found');
      return;
    }
    
    // Prevent double initialization
    if (indicatorsContainer.hasAttribute('data-initialized')) {
      if (DEBUG) console.log('[SpaceLanesApp] Carousel already initialized, skipping');
      return;
    }
    indicatorsContainer.setAttribute('data-initialized', 'true');
    
    let currentIndex = 0;
    const slides = track.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    if (DEBUG) console.log(`[SpaceLanesApp] Carousel initialized with ${totalSlides} slides`);
    
    // Create indicators
    indicatorsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const indicator = document.createElement('button');
      indicator.className = 'carousel-indicator';
      indicator.setAttribute('aria-label', `Go to mission ${i + 1}`);
      indicator.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
      });
      indicatorsContainer.appendChild(indicator);
    }
    
    const indicators = indicatorsContainer.querySelectorAll('.carousel-indicator');
    
    // Set aria-live for screen readers
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.setAttribute('aria-atomic', 'true');
    
    const updateCarousel = () => {
      // Each slide takes exactly 100% of wrapper width
      const wrapperWidth = wrapper.offsetWidth;
      const offset = currentIndex * wrapperWidth;
      
      if (DEBUG) console.log(`[SpaceLanesApp] Carousel update: index=${currentIndex}, slideWidth=${wrapperWidth}px, offset=${offset}px`);
      
      track.style.transform = `translateX(-${offset}px)`;
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
        indicator.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
      });
      
      // Update button states and ARIA
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === totalSlides - 1;
      prevBtn.setAttribute('aria-disabled', currentIndex === 0);
      nextBtn.setAttribute('aria-disabled', currentIndex === totalSlides - 1);
      
      // Announce to screen readers
      const currentSlide = slides[currentIndex];
      const cardTitle = currentSlide.querySelector('.card-title')?.textContent;
      if (cardTitle) {
        wrapper.setAttribute('aria-label', `Viewing ${cardTitle}`);
      }
    };
    
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentIndex < totalSlides - 1) {
        currentIndex++;
        updateCarousel();
      }
    });
    
    // Keyboard navigation (only when carousel is focused)
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        currentIndex--;
        updateCarousel();
      } else if (e.key === 'ArrowRight' && currentIndex < totalSlides - 1) {
        e.preventDefault();
        currentIndex++;
        updateCarousel();
      }
    });
    
    // Update on window resize
    window.addEventListener('resize', updateCarousel);
    
    updateCarousel();
  }
  
  updateNavForLoggedInUser() {
    const authLinks = document.querySelector('.auth-links');
    if (!authLinks) return;
    
    authLinks.innerHTML = `
      <span class="text-glow-cyan">Welcome, ${this.user.username}</span>
      <button class="btn btn-secondary" data-auth="logout">Logout</button>
    `;
    this.setupAuth();
  }
  
  checkAuthState() {
    // Redirect logged-in users away from auth pages
    if ((this.currentPage === 'login' || this.currentPage === 'register') && this.user) {
      window.location.href = 'index.html';
    }
    // Game page allows guests but won't save scores
  }
  
  logout() {
    this.storage.logoutUser();
    window.location.href = 'index.html';
  }

  setupLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Clear previous errors
      this.clearError('usernameError');
      this.clearError('passwordError');
      this.clearError('formError');
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      
      // Basic validation
      if (!username) {
        this.showError('usernameError', 'Username is required');
        return;
      }
      
      if (!password) {
        this.showError('passwordError', 'Password is required');
        return;
      }
      
      // Attempt login
      const result = this.storage.loginUser(username, password);
      
      if (result.success) {
        this.showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        this.showError('formError', result.message);
      }
    });
  }

  setupRegisterPage() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    // Real-time password validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    passwordInput.addEventListener('input', () => {
      const validation = this.storage.validatePassword(passwordInput.value);
      
      if (!validation.valid) {
        this.showError('passwordError', validation.message);
        this.clearSuccess('passwordSuccess');
      } else {
        this.clearError('passwordError');
        this.showSuccess('passwordSuccess', validation.message);
      }
    });
    
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
        this.showError('confirmPasswordError', 'Passwords do not match');
      } else {
        this.clearError('confirmPasswordError');
      }
    });
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Clear all errors
      document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-success').forEach(el => el.textContent = '');
      
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      
      let isValid = true;
      
      // Validate username
      if (!username) {
        this.showError('usernameError', 'Username is required');
        isValid = false;
      }
      
      // Validate email
      if (!email) {
        this.showError('emailError', 'Email is required');
        isValid = false;
      } else if (!this.storage.validateEmail(email)) {
        this.showError('emailError', 'Please enter a valid email address');
        isValid = false;
      }
      
      // Validate password
      const passwordValidation = this.storage.validatePassword(password);
      if (!passwordValidation.valid) {
        this.showError('passwordError', passwordValidation.message);
        isValid = false;
      }
      
      // Validate confirm password
      if (password !== confirmPassword) {
        this.showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
      }
      
      // Validate phone if provided
      if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
        this.showError('phoneError', 'Please enter a valid phone number');
        isValid = false;
      }
      
      if (!isValid) return;
      
      // Attempt registration
      const userData = {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        address
      };
      
      const result = this.storage.registerUser(userData);
      
      if (result.success) {
        this.showNotification('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        this.showError('formError', result.message);
      }
    });
  }
  
  // Helper methods for error/success messages
  showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'flex';
    }
  }
  
  clearError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }
  
  showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'flex';
    }
  }
  
  clearSuccess(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  setupRankingsPage() {
    this.displayLeaderboard();
  }

  _formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  _formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  _getRankBadgeClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  }

  displayLeaderboard() {
    const container = document.getElementById('globalLeaderboard');
    if (!container) return;
    
    const scores = this.storage.getTopScores(20);

    if (!scores || scores.length === 0) {
      container.innerHTML = '<div class="empty-state">No scores yet. Be the first to play!</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'rankings-table';

    const tbody = document.createElement('tbody');
    scores.forEach((score, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="rank-badge ${this._getRankBadgeClass(index + 1)}">
            ${index + 1}
          </div>
        </td>
        <td>${score.username}</td>
        <td><span class="score-value">${score.score.toLocaleString()}</span></td>
        <td>${this._formatDuration(score.duration)}</td>
        <td>${this._formatDate(score.timestamp)}</td>
      `;
      tbody.appendChild(tr);
    });

    table.innerHTML = `
      <thead>
        <tr>
          <th>Rank</th>
          <th>Pilot</th>
          <th>Score</th>
          <th>Duration</th>
          <th>Date</th>
        </tr>
      </thead>
    `;
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: var(--glass-bg);
      border: 1px solid var(--color-cyan-primary);
      border-radius: 8px;
      color: var(--color-text-primary);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

window.app = new SpaceLanesApp();
