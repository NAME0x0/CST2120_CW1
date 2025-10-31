/**
 * SVG Icons & Graphics Helper
 * Provides utility functions for working with SVG icons
 */

console.log('[svgHelper.js] Module loaded');

export class SVGHelper {
  static _loading = false;
  static _loaded = false;
  
  static loadIcons() {
    console.log('[SVGHelper] loadIcons called');
    
    // Check if already loaded or currently loading
    if (this._loaded) {
      console.log('[SVGHelper] Icons already loaded, skipping');
      return;
    }
    
    if (this._loading) {
      console.log('[SVGHelper] Icons already loading, skipping duplicate request');
      return;
    }
    
    // Check DOM as well
    if (document.getElementById('svg-icons-sprite')) {
      console.log('[SVGHelper] Icons already in DOM, skipping');
      this._loaded = true;
      return;
    }
    
    this._loading = true;
    console.log('[SVGHelper] Fetching icons SVG...');
    
    fetch('/assets/images/icons.svg')
      .then(response => response.text())
      .then(svg => {
        // Double-check it wasn't added while we were fetching
        if (document.getElementById('svg-icons-sprite')) {
          console.log('[SVGHelper] Icons were added during fetch, skipping injection');
          this._loaded = true;
          this._loading = false;
          return;
        }
        
        console.log('[SVGHelper] Icons loaded, injecting into DOM');
        const container = document.createElement('div');
        container.id = 'svg-icons-sprite';
        container.style.display = 'none';
        container.innerHTML = svg;
        document.body.insertBefore(container, document.body.firstChild);
        console.log('[SVGHelper] Icons sprite injected successfully');
        this._loaded = true;
        this._loading = false;
      })
      .catch(err => {
        console.warn('[SVGHelper] Could not load SVG icons:', err);
        this._loading = false;
      });
  }
  
  static createIcon(iconName, options = {}) {
    const {
      size = 24,
      color = 'currentColor',
      className = '',
      ariaLabel = ''
    } = options;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('class', `icon icon-${iconName} ${className}`);
    svg.setAttribute('aria-hidden', ariaLabel ? 'false' : 'true');
    if (ariaLabel) svg.setAttribute('aria-label', ariaLabel);
    
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#icon-${iconName}`);
    
    svg.appendChild(use);
    svg.style.color = color;
    
    return svg;
  }
  
  static insertIconBefore(iconName, element, options = {}) {
    const icon = this.createIcon(iconName, options);
    element.insertBefore(icon, element.firstChild);
    return icon;
  }
  
  static insertIconAfter(iconName, element, options = {}) {
    const icon = this.createIcon(iconName, options);
    element.appendChild(icon);
    return icon;
  }
  
  static replaceWithIcon(iconName, element, options = {}) {
    const icon = this.createIcon(iconName, options);
    element.parentNode.replaceChild(icon, element);
    return icon;
  }
}

// Auto-load icons when module is imported
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SVGHelper.loadIcons());
  } else {
    SVGHelper.loadIcons();
  }
}
