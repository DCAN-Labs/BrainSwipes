<template>
  <div v-if="!authenticated">
    <b-button class="btn btn-primary" @click="loginWithGlobus">Login with Globus</b-button>
  </div>
  <div v-else>
    <b-button class="btn btn-primary" @click="logoutOfGlobus">Logout of Globus</b-button>
    <p>globusToken: {{globusToken}}</p>
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
      authenticated: false,
      globusUserInfo: {},
    };
  },
  props: {
    globusToken: {
      type: String,
      required: true,
    },
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
          const accessToken = resp.access_token;
          this.$emit('globusLogin', accessToken);

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
      this.$emit('globusLogin', '');
      this.$router.push({ name: 'Home' });
    },
    allowAccess() {
      if (this.globusToken) {
        this.authenticated = true;
      }
    },
    getUserInfo() {
      if (this.globusToken) {
        console.log('Getting user information with token !');
        fetch('https://auth.globus.org/p/whoami?include=identity_provider', {
          headers: new Headers({
            Authorization: `Bearer ${this.globusToken}`,
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