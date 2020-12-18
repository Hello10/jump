import {
  isValidEmail,
  isValidPhoneNumber
} from './validators';

export default function determineAddressType (address) {
  if (isValidEmail(address)) {
    return 'email';
  }

  if (isValidPhoneNumber(address)) {
    return 'phone';
  }

  return null;
}
