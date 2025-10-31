console.log('[storage.js] Module loaded');

export class StorageManager {
  constructor() {
    console.log('[StorageManager] Constructor called');
    this.keys = {
      USERS: 'spaceLanes_users',
      CURRENT_USER: 'spaceLanes_currentUser',
      SCORES: 'spaceLanes_scores',
      SETTINGS: 'spaceLanes_settings'
    };
    this.init();
  }
  
  init() {
    console.log('[StorageManager] Initializing localStorage...');
    if (!this.getUsers()) {
      console.log('[StorageManager] No users found, creating empty users object');
      this.saveUsers({});
    } else {
      console.log('[StorageManager] Users loaded:', Object.keys(this.getUsers()).length, 'users');
    }
    if (!this.getScores()) {
      console.log('[StorageManager] No scores found, creating empty scores array');
      this.saveScores([]);
    } else {
      console.log('[StorageManager] Scores loaded:', this.getScores().length, 'scores');
    }
    if (!this.getSettings()) {
      console.log('[StorageManager] No settings found, creating default settings');
      this.saveSettings({ reducedMotion: false, soundEnabled: false });
    } else {
      console.log('[StorageManager] Settings loaded:', this.getSettings());
    }
    console.log('[StorageManager] Initialization complete');
  }
  
  getUsers() {
    try {
      const data = localStorage.getItem(this.keys.USERS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read users from localStorage:', e);
      return null;
    }
  }
  
  saveUsers(users) {
    try {
      localStorage.setItem(this.keys.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage:', e);
    }
  }
  
  /**
   * Registers a new user with validation
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Unique username
   * @param {string} userData.email - Valid email address
   * @param {string} userData.password - User password (stored in plaintext for coursework)
   * @param {string} [userData.firstName] - Optional first name
   * @param {string} [userData.lastName] - Optional last name
   * @param {string} [userData.phone] - Optional phone number
   * @param {string} [userData.address] - Optional address
   * @returns {Object} Result object with success flag and message
   */
  registerUser(userData) {
    const users = this.getUsers();
    if (!userData.username || !userData.email || !userData.password) {
      return { success: false, message: 'Missing required fields' };
    }
    if (users[userData.username]) {
      return { success: false, message: 'Username already exists' };
    }
    const emailExists = Object.values(users).some(u => u.email === userData.email);
    if (emailExists) {
      return { success: false, message: 'Email already registered' };
    }
    // SECURITY WARNING: Passwords are stored in plaintext.
    // In a production environment, they should be hashed before storage.
    users[userData.username] = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      address: userData.address || '',
      registeredAt: new Date().toISOString(),
      scores: [],
      stats: { totalGames: 0, totalScore: 0, highScore: 0 }
    };
    this.saveUsers(users);
    return { success: true, message: 'Registration successful', user: users[userData.username] };
  }
  
  /**
   * Authenticates a user with username and password
   * @param {string} username - Username to authenticate
   * @param {string} password - Password to verify
   * @returns {Object} Result with success flag, message, and user object if successful
   */
  loginUser(username, password) {
    const users = this.getUsers();
    const user = users[username];
    if (!user) return { success: false, message: 'User not found' };
    if (user.password !== password) return { success: false, message: 'Incorrect password' };
    localStorage.setItem(this.keys.CURRENT_USER, username);
    return { success: true, message: 'Login successful', user };
  }
  
  getCurrentUser() {
    const username = localStorage.getItem(this.keys.CURRENT_USER);
    if (!username) return null;
    const users = this.getUsers();
    return users[username] || null;
  }
  
  logoutUser() {
    localStorage.removeItem(this.keys.CURRENT_USER);
  }
  
  getScores() {
    try {
      const data = localStorage.getItem(this.keys.SCORES);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read scores from localStorage:', e);
      return null;
    }
  }
  
  saveScores(scores) {
    try {
      localStorage.setItem(this.keys.SCORES, JSON.stringify(scores));
    } catch (e) {
      console.error('Failed to save scores to localStorage:', e);
    }
  }
  
  /**
   * Saves a user's game score to localStorage
   * @param {string} username - Username of the player
   * @param {Object} scoreData - Score information
   * @param {number} scoreData.score - Final score achieved
   * @param {number} scoreData.duration - Game duration in seconds
   * @returns {Object} Result with success flag and saved score object
   */
  saveScore(username, scoreData) {
    // Validate score data
    if (!scoreData || typeof scoreData.score !== 'number' || typeof scoreData.duration !== 'number') {
      return { success: false, message: 'Invalid score data' };
    }
    
    const users = this.getUsers();
    const user = users[username];
    if (!user) return { success: false, message: 'User not found' };
    const score = {
      username,
      score: scoreData.score,
      duration: scoreData.duration,
      timestamp: new Date().toISOString()
    };
    user.scores.push(score);
    user.scores.sort((a, b) => b.score - a.score);
    user.scores = user.scores.slice(0, 10);
    user.stats.totalGames++;
    user.stats.totalScore += score.score;
    user.stats.highScore = Math.max(user.stats.highScore, score.score);
    this.saveUsers(users);
    const scores = this.getScores();
    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    this.saveScores(scores);
    return { success: true, message: 'Score saved', score };
  }
  
  getTopScores(limit = 10) {
    return this.getScores().slice(0, limit);
  }
  
  getUserScores(username) {
    const users = this.getUsers();
    const user = users[username];
    return user ? user.scores : [];
  }
  
  getSettings() {
    try {
      const data = localStorage.getItem(this.keys.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read settings from localStorage:', e);
      return null;
    }
  }
  
  saveSettings(settings) {
    try {
      localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }
  
  /**
   * Validates email format using regex
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email format is valid
   */
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  /**
   * Validates password strength (min 6 chars, 1 uppercase, 1 number)
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with valid flag and message
   */
  validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }
    return { valid: true, message: 'Password is strong' };
  }
  
  clearAllData() {
    Object.values(this.keys).forEach(key => localStorage.removeItem(key));
    this.init();
  }
}
