// Enterprise Security & Input Validation Engine for Championship Arena

// RFC 5322 Compliant Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common Weak Passwords Blacklist
const WEAK_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', 'qwerty123', 'admin123',
  'letmein1', 'welcome1', 'iloveyou', 'gaming123', 'player123', 'arcade123'
]);

// Reserved System GamerTags
const RESERVED_TAGS = new Set([
  'admin', 'administrator', 'moderator', 'system', 'root', 'bot', 'official',
  'cyberarcade', 'support', 'help', 'null', 'undefined', 'anonymous', 'guest'
]);

/**
 * Validates Email Address with strict format and domain checks
 * @param {string} email
 * @returns {{ isValid: boolean, error: string | null, sanitizedEmail: string }}
 */
export function validateEmail(email) {
  const clean = String(email || '').trim().toLowerCase();

  if (!clean) {
    return { isValid: false, error: 'Email address is required.', sanitizedEmail: '' };
  }

  if (clean.length > 254) {
    return { isValid: false, error: 'Email address is too long (maximum 254 characters).', sanitizedEmail: '' };
  }

  if (!EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. player@example.com).', sanitizedEmail: '' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2 || !parts[1].includes('.')) {
    return { isValid: false, error: 'Invalid domain name in email address.', sanitizedEmail: '' };
  }

  const domain = parts[1].toLowerCase();

  // Detect common typo domains
  const TYPO_MAP = {
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com'
  };

  if (TYPO_MAP[domain]) {
    return { 
      isValid: false, 
      error: `Did you mean @${TYPO_MAP[domain]}? Please check your email spelling.`, 
      sanitizedEmail: '' 
    };
  }

  // Block obvious fake/throwaway test domains
  const DUMMY_DOMAINS = new Set(['test.com', 'fake.com', 'asdf.com', 'qwerty.com', 'tempmail.com']);
  if (DUMMY_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Please enter your real email address so you can access your profile & rank.',
      sanitizedEmail: ''
    };
  }

  return { isValid: true, error: null, sanitizedEmail: clean };
}


/**
 * Evaluates Password Security Strength and Returns 0-4 Score with actionable feedback
 * @param {string} password
 * @returns {{ isValid: boolean, score: number, label: string, color: string, feedback: string[] }}
 */
export function evaluatePasswordStrength(password) {
  const pwd = String(password || '');
  const feedback = [];
  let score = 0;

  if (pwd.length < 8) {
    feedback.push('Must be at least 8 characters long.');
  } else {
    score += 1;
  }

  if (WEAK_PASSWORDS.has(pwd.toLowerCase())) {
    return {
      isValid: false,
      score: 0,
      label: 'Compromised',
      color: '#ef4444',
      feedback: ['This password is too common and easily guessed. Please choose a unique password.']
    };
  }

  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) {
    score += 1;
  } else {
    feedback.push('Include both uppercase and lowercase letters.');
  }

  if (/\d/.test(pwd)) {
    score += 1;
  } else {
    feedback.push('Include at least one number (0-9).');
  }

  if (/[^a-zA-Z0-9]/.test(pwd)) {
    score += 1;
  } else {
    feedback.push('Include at least one special symbol (e.g. !@#$%^&*).');
  }

  const labels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  return {
    isValid: score >= 2 && pwd.length >= 8,
    score,
    label: labels[score] || 'Too Weak',
    color: colors[score] || '#ef4444',
    feedback
  };
}

/**
 * Validates GamerTag handle
 * @param {string} gamertag
 * @returns {{ isValid: boolean, error: string | null, sanitizedTag: string }}
 */
export function validateGamerTag(gamertag) {
  const clean = String(gamertag || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!clean) {
    return { isValid: false, error: 'GamerTag handle is required.', sanitizedTag: '' };
  }

  if (clean.length < 3) {
    return { isValid: false, error: 'GamerTag must be at least 3 characters.', sanitizedTag: clean };
  }

  if (clean.length > 16) {
    return { isValid: false, error: 'GamerTag cannot exceed 16 characters.', sanitizedTag: clean.slice(0, 16) };
  }

  if (RESERVED_TAGS.has(clean)) {
    return { isValid: false, error: `@${clean} is a reserved handle. Please choose another GamerTag.`, sanitizedTag: clean };
  }

  if (/^[0-9]/.test(clean)) {
    return { isValid: false, error: 'GamerTag must start with a letter.', sanitizedTag: clean };
  }

  return { isValid: true, error: null, sanitizedTag: clean };
}

/**
 * Validates and sanitizes Player Display Name
 * @param {string} name
 * @returns {{ isValid: boolean, error: string | null, sanitizedName: string }}
 */
export function validateDisplayName(name) {
  // Strip potential HTML tags and control characters
  const clean = String(name || '')
    .replace(/<[^>]*>/gm, '')
    .replace(/[\r\n\t]/g, ' ')
    .trim();

  if (!clean) {
    return { isValid: false, error: 'Display name cannot be empty.', sanitizedName: 'Player' };
  }

  if (clean.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters.', sanitizedName: clean };
  }

  if (clean.length > 20) {
    return { isValid: false, error: 'Display name cannot exceed 20 characters.', sanitizedName: clean.slice(0, 20) };
  }

  return { isValid: true, error: null, sanitizedName: clean };
}

/**
 * Validates 4 to 8-digit PIN
 * @param {string} pin
 * @returns {{ isValid: boolean, error: string | null, sanitizedPin: string }}
 */
export function validatePin(pin) {
  const clean = String(pin || '').replace(/\D/g, '').slice(0, 8);

  if (clean.length < 4) {
    return { isValid: false, error: 'PIN must be at least 4 digits.', sanitizedPin: clean };
  }

  return { isValid: true, error: null, sanitizedPin: clean };
}
