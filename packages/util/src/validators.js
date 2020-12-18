import urlRegex from 'url-regex-safe';
import emailRegex from 'email-regex';
import phoneRegex from 'phone-regex';

export function isValidUrlStrict (url) {
  const regex = urlRegex({
    exact: true,
    strict: true
  });
  return regex.test(url);
}

export function isValidUrl (url) {
  const regex = urlRegex({exact: true});
  return regex.test(url);
}

export function isValidEmail (email) {
  const regex = emailRegex({exact: true});
  return regex.test(email);
}

export function isValidPhoneNumber (number) {
  const regex = phoneRegex({exact: true});
  return regex.test(number);
}
