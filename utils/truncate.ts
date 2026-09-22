const truncateEmail = (email: string | undefined): string => {
  if (!email) return 'User';

  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;

  const address = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const addLen = address.length;

  if (addLen <= 2) return `*@${domain}`;

  const visibleLen = Math.ceil(addLen / 2) - 1;
  return `${address.slice(0, visibleLen)}${'*'.repeat(addLen - visibleLen)}@${domain}`;
};

const truncate = (input: string, len: number = 15): string => {
  const LENGTH = Math.max(0, Math.trunc(len));
  const chars = Array.from(input);

  if (chars.length > LENGTH) {
    return `${chars.slice(0, LENGTH).join('')}...`;
  } else return input;
};

export { truncate, truncateEmail };
