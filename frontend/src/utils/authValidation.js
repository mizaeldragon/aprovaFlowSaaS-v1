const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || '').trim());
}

export function isStrongPassword(value) {
  return STRONG_PASSWORD_REGEX.test(String(value || ''));
}

export function validateLoginInput({ email, password }) {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (!normalizedEmail) {
    errors.email = 'Informe seu e-mail.';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (!normalizedPassword) {
    errors.password = 'Informe sua senha.';
  } else if (normalizedPassword.length < 6) {
    errors.password = 'A senha precisa ter no minimo 6 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: { email: normalizedEmail, password: normalizedPassword },
  };
}

export function validateRegisterInput({ agencyName, name, email, password }) {
  const errors = {};
  const normalizedAgencyName = String(agencyName || '').trim();
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (!normalizedAgencyName) {
    errors.agencyName = 'Informe o nome da agencia/equipe.';
  } else if (normalizedAgencyName.length < 2 || normalizedAgencyName.length > 80) {
    errors.agencyName = 'Nome da agencia deve ter entre 2 e 80 caracteres.';
  }

  if (!normalizedName) {
    errors.name = 'Informe seu nome completo.';
  } else if (normalizedName.length < 2 || normalizedName.length > 80) {
    errors.name = 'Seu nome deve ter entre 2 e 80 caracteres.';
  }

  if (!normalizedEmail) {
    errors.email = 'Informe seu e-mail.';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (!normalizedPassword) {
    errors.password = 'Informe uma senha.';
  } else if (!isStrongPassword(normalizedPassword)) {
    errors.password = 'Use 8+ caracteres com maiuscula, minuscula, numero e simbolo.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      agencyName: normalizedAgencyName,
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
    },
  };
}

export function validateForgotPasswordInput({ email }) {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    errors.email = 'Informe seu e-mail.';
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = 'Informe um e-mail valido.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: { email: normalizedEmail },
  };
}

export function validateResetPasswordInput({ token, password, confirmPassword }) {
  const errors = {};
  const normalizedToken = String(token || '').trim();
  const normalizedPassword = String(password || '');
  const normalizedConfirmPassword = String(confirmPassword || '');

  if (!normalizedToken) {
    errors.token = 'Token de recuperacao invalido.';
  }

  if (!normalizedPassword) {
    errors.password = 'Informe a nova senha.';
  } else if (!isStrongPassword(normalizedPassword)) {
    errors.password = 'Use 8+ caracteres com maiuscula, minuscula, numero e simbolo.';
  }

  if (!normalizedConfirmPassword) {
    errors.confirmPassword = 'Confirme sua nova senha.';
  } else if (normalizedConfirmPassword !== normalizedPassword) {
    errors.confirmPassword = 'As senhas nao conferem.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      token: normalizedToken,
      password: normalizedPassword,
      confirmPassword: normalizedConfirmPassword,
    },
  };
}
