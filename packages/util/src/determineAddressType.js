import isValidEmail from './isValidEmail';
import isValidPhoneNumber from './isValidPhoneNumber';

export default function determineAddressType (address) {
  if (isValidEmail(address)) {
    return 'email';
  }

  if (isValidPhoneNumber(address)) {
    return 'phone';
  }

  return null;
}
