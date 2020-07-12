import emailRegex from 'email-regex';

export default function isValidEmail (email) {
  const regex = emailRegex({exact: true});
  return regex.test(email);
}
