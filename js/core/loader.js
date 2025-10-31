/**
 * Space Lanes - Loading Screen Controller
 * Manages the initial loading experience with progress bar and tips
 */

console.log('[loader.js] Module loaded');

export class LoadingController {
  constructor() {
    console.log('[LoadingController] Constructor called');
    this.loadingScreen = document.getElementById('loadingScreen');
    if (!this.loadingScreen) {
      console.warn('[LoadingController] Loading screen element not found - aborting');
      return; // Exit if loading screen doesn't exist
    }
    console.log('[LoadingController] Loading screen element found');
    
    this.loadingBar = document.getElementById('loadingBar');
    this.loadingPercentage = document.getElementById('loadingPercentage');
    this.loadingTip = document.getElementById('loadingTip');
    
    this.progress = 0;
    this.targetProgress = 0;
    
    this.tips = [
      'Use WASD or Arrow keys to navigate through space lanes',
      'Collect energy shards to build combo multipliers',
      'Avoid asteroids and quantum rifts to survive',
      'Perfect navigation chains earn legendary scores',
      'Ion storms slow your craft - time your moves carefully',
      'Higher combos unlock better score multipliers',
      'Register an account to save your progress',
      'Switch lanes quickly to avoid incoming obstacles',
      'Master the timing to achieve flow state'
    ];
    
    console.log('[LoadingController] Initializing with', this.tips.length, 'tips');
    this.init();
  }
  
  init() {
    if (!this.loadingScreen) {
      console.warn('[LoadingController] Loading screen missing - aborting init');
      return; // Guard against missing elements
    }
    console.log('[LoadingController] Starting loading sequence');
    this.displayRandomTip();
    this.simulateLoading();
  }
  
  displayRandomTip() {
    if (!this.loadingTip) return; // Guard against missing element
    const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
    this.loadingTip.textContent = randomTip;
    console.log('[LoadingController] Displaying tip:', randomTip);
  }
  
  simulateLoading() {
    // Simulate various loading stages
    const stages = [
      { delay: 100, progress: 15 },
      { delay: 300, progress: 35 },
      { delay: 500, progress: 55 },
      { delay: 700, progress: 75 },
      { delay: 900, progress: 90 },
      { delay: 1200, progress: 100 }
    ];
    
    stages.forEach(stage => {
      setTimeout(() => {
        this.updateProgress(stage.progress);
      }, stage.delay);
    });
    
    // Hide loading screen when complete
    setTimeout(() => {
      this.complete();
    }, 1500);
  }
  
  updateProgress(target) {
    this.targetProgress = target;
    this.animateProgress();
  }
  
  animateProgress() {
    if (this.progress < this.targetProgress) {
      this.progress += 1;
      
      if (this.loadingBar) {
        this.loadingBar.style.width = `${this.progress}%`;
      }
      
      if (this.loadingPercentage) {
        this.loadingPercentage.textContent = `${Math.floor(this.progress)}%`;
      }
      
      requestAnimationFrame(() => this.animateProgress());
    }
  }
  
  complete() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden');
      
      // Remove from DOM after transition
      setTimeout(() => {
        if (this.loadingScreen.parentNode) {
          this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        }
      }, 600);
      
      // Dispatch loaded event
      document.dispatchEvent(new CustomEvent('app:loaded'));
    }
  }
}
