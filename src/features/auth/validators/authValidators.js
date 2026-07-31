export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
};

export const validateFullName = (name) => {
  if (!name || name.trim().length === 0) return 'Full name is required.';
  if (name.trim().length < 2) return 'Full name must be at least 2 characters.';
  return null;
};

export const validateMobile = (mobile) => {
  if (!mobile) return null; // Optional
  const mobileRegex = /^[0-9+\-\s()]{7,15}$/;
  if (!mobileRegex.test(mobile)) return 'Please enter a valid phone number.';
  return null;
};
