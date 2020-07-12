import emailRegex from 'email-regex';
import phoneRegex from 'phone-regex';

export default function determineAddressType (address) {
  const email = emailRegex({exact: true});
  if (email.test(address)) {
    return 'email';
  }

  const phone = phoneRegex({exact: true});
  if (phone.test(address)) {
    return 'phone';
  }

  return null;
}
