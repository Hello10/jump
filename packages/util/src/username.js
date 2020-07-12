import readableCode from './readableCode';

const suffix_length = 16;
const prefix = 'person';

const regex = new RegExp(`^${prefix}\\.[A-Za-z0-9]{${suffix_length}}$`);

export function generateUsername () {
  const suffix = readableCode(suffix_length);
  return `${prefix}.${suffix}`;
}

export function isGeneratedUsername (username) {
  return username.match(regex);
}
