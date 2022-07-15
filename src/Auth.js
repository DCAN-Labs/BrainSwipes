import PKCE from 'js-pkce';

// Reference: https://github.com/bpedroza/js-pkce
const PkceAuth = new PKCE({
  client_id: 'ec1482f4-69f6-435b-97b2-d243f39babb3',
  redirect_uri: 'https://brainswipes.us/restricted',
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize',
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token',
  requested_scopes: 'openid profile email',
});

export default PkceAuth;
