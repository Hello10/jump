export function isExisting ({context}) {
  return !!context.user;
}

export function isSignedIn ({context}) {
  return !!context.user_id;
}

export function isPublic () {
  return true;
}
