export const SECRET_QUESTIONS = [
  "What is the name of your least favorite child?",
  "In what year did you abandon your dreams?",
  "What is the maiden name of your father's mistress?",
  "At what age did your childhood pet run away?",
  "What was the name of your favorite unpaid internship?",
  "What is your ex-wife's newest last name?",
  "What sports team do you obsess over to avoid meaningful discussion with others?",
  "What is the name of your favorite canceled TV show?",
  "On what street did you lose your childlike sense of wonder?",
  "When did you stop trying?",
];

export const PASSWORD_MIN_LENGTH = 3;
export const PASSWORD_MAX_LENGTH = 10;

export const JWT_COOKIE_NAME = "token";
export const ROLE_COOKIE_NAME = "ui_setting";

export const ROLE_COOKIE_VALUES = {
  admin: "0",
  customer: "1",
} as const;

export const JWT_SECRET = "nohackme-super-secret-key-2024";
export const JWT_EXPIRY = "5y";
