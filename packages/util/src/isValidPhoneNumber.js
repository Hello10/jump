import phoneRegex from 'phone-regex';

export default function isValidPhoneNumber (number) {
  const regex = phoneRegex({exact: true});
  return regex.test(number);
}
