import PKCE from 'js-pkce';

// Reference: https://github.com/bpedroza/js-pkce
const PkceAuth = new PKCE({
  client_id: 'ec1482f4-69f6-435b-97b2-d243f39babb3',  // Update this using your native client ID
  redirect_uri: 'http://localhost:8080/restricted',  // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize',  // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token',  // No changes needed
  requested_scopes: 'openid profile email',  // Update with any scopes you would need, e.g. transfer
});

export default PkceAuth;
