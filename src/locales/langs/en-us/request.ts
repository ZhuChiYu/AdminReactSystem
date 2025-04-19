const request: App.I18n.Schema['translation']['request'] = {
  apiErrorMsg: 'API Error Message',
  error: 'Request Error',
  errorInfo:
    'The request has encountered an error, possibly due to expired user session information or insufficient permissions. Please check the specific error message.',
  logout: 'Logout user after request failed',
  logoutMsg: 'User status is invalid, please log in again',
  logoutWithModal: 'Pop up modal after request failed and then log out user',
  logoutWithModalMsg: 'User status is invalid, please log in again',
  refreshToken: 'The requested token has expired, refresh the token',
  resendApiText: 'Resend Request',
  tokenExpired: 'The requested token has expired'
};

export default request;
