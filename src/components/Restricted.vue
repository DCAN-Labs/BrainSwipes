<template>
  <div v-if="!authenticated">
    <b-button class="btn btn-primary" @click="loginWithGlobus">Login with Globus</b-button>
  </div>
  <div v-else>
    <b-button class="btn btn-primary" @click="logoutOfGlobus">Logout of Globus</b-button>
    <p>{{authToken}}</p>
    <b-button class="btn btn-warn" @click="getUserInfo">Get User Info</b-button>
  </div>
</template>

<script>
// Reference: https://github.com/bpedroza/js-pkce
import PkceAuth from '../Auth';

export default {
  name: 'restricted',
  data() {
    return {
      authToken: '',
      rawIdToken: '',
      idToken: '',
      authenticated: false,
      globusUserInfo: {},
    };
  },
  methods: {
    loginWithGlobus() {
      const authUrl = PkceAuth.authorizeUrl();
      console.log(`Sending the user to ${authUrl}`);
      window.location.replace(authUrl);
    },
    checkForGlobusAuthCode() {
      const params = new URLSearchParams(window.location.search);
      const authCode = params.get('code');
      if (authCode) {
        console.log('Getting a token...');
        const url = window.location.href;
        PkceAuth.exchangeForAccessToken(url).then((resp) => {
          console.log(resp);
          // If you get back multiple tokens you'll need to make changes here.
          const accessToken = resp.access_token;
          const idToken = resp.id_token;

          // Set it in local storage - the are a number of alternatives for
          // saving this that are arguably more secure but this is the simplest
          // for demonstration purposes.
          window.localStorage.setItem('authToken', accessToken);
          window.localStorage.setItem('idToken', idToken);

          // This isn't strictly necessary but it ensures no code reuse.
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('pkce_state');
          console.log('Cleared the PKCE state!');

          // Redirect back to the root URL (simple but brittle way to clear the query params)
          this.$router.push({ name: 'Restricted' });
        });
      }
    },
    logoutOfGlobus() {
      // Should revoke here
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('idToken');
      this.$router.push({ name: 'Home' });
    },
    allowAccess() {
      this.authToken = localStorage.getItem('authToken');
      this.rawIdToken = localStorage.getItem('idToken');
      if (this.authToken) {
        this.authenticated = true;
      }
    },
    getUserInfo() {
      if (this.authToken) {
        console.log('Getting user information with token !');
        fetch('https://auth.globus.org/p/whoami?include=identity_provider', {
          headers: new Headers({
            Authorization: `Bearer ${this.authToken}`,
          }),
        }).then(response => response.json())
        .then((responseData) => {
          this.globusUserInfo = responseData.identities;
          console.log(this.globusUserInfo);
        });
      }
    },
  },
  created() {
    this.checkForGlobusAuthCode();
    this.allowAccess();
  },
};
</script>

<style>

</style>