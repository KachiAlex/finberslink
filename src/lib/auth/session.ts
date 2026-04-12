export async function requireSession() {
  return {
    user: {
      id: '',
      email: '',
    },
  };
}

export async function getSessionFromCookies() {
  return {
    user: {
      id: '',
      email: '',
    },
  };
}
