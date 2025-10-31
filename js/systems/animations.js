/**
 * Space Lanes - GSAP Animation System
 * Manages scroll-triggered animations and effects
 */

console.log('[animations.js] Module loaded');

export class AnimationSystem {
  constructor() {
    console.log('[AnimationSystem] Constructor called');
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[AnimationSystem] GSAP or ScrollTrigger not loaded - animations disabled');
      return;
    }
    
    console.log('[AnimationSystem] GSAP available, registering ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);
    this.init();
  }
  
  init() {
    console.log('[AnimationSystem] Initializing animations...');
    this.animateHero();
    this.animateHorizontalScroll();
    this.animateFeatures();
    this.animateCTA();
    console.log('[AnimationSystem] All animations initialized');
  }
  
  animateHero() {
    // Hero content animations
    const tl = gsap.timeline();
    
    tl.from('.hero-title span', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    })
    .from('.hero-subtitle', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.5')
    .from('.hero-stats .stat-item', {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.7)'
    }, '-=0.4')
    .from('.hero-cta .btn', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    }, '-=0.3');
  }
  
  animateHorizontalScroll() {
    // Initialize carousel
    this.initCarousel();
  }
  
  initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!track || !prevBtn || !nextBtn) return;
    
    const cards = track.querySelectorAll('.mission-card');
    if (cards.length === 0) return;
    
    let currentIndex = 0;
    
    // Create indicators
    cards.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
      indicator.addEventListener('click', () => goToSlide(index));
      indicatorsContainer.appendChild(indicator);
    });
    
    const indicators = indicatorsContainer.querySelectorAll('.carousel-indicator');
    
    function updateCarousel() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
      });
      
      // Update buttons
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === cards.length - 1;
    }
    
    function goToSlide(index) {
      currentIndex = Math.max(0, Math.min(index, cards.length - 1));
      updateCarousel();
    }
    
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentIndex < cards.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const carouselSection = document.querySelector('.carousel-container');
      if (!carouselSection) return;
      
      const rect = carouselSection.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom >= 0;
      
      if (isInView) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevBtn.click();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextBtn.click();
        }
      }
    });
    
    updateCarousel();
  }
  
  animateFeatures() {
    const features = gsap.utils.toArray('.feature-card');
    
    features.forEach((feature, i) => {
      gsap.from(feature, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: feature,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        }
      });
      
      // Hover effect enhancement
      feature.addEventListener('mouseenter', () => {
        gsap.to(feature, {
          y: -10,
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      feature.addEventListener('mouseleave', () => {
        gsap.to(feature, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  }
  
  animateCTA() {
    gsap.from('.cta-title', {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 70%'
      }
    });
    
    gsap.from('.cta-subtitle', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 70%'
      }
    });
    
    gsap.from('.cta-buttons .btn', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.cta-buttons',
        start: 'top 80%'
      }
    });
  }
  
  // Parallax effect for background elements
  createParallax(selector, speed = 0.5) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
      gsap.to(el, {
        y: () => -(el.offsetHeight * speed),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }
}
