<template>
  <div id="restricted">
    <div v-if="!authenticated">
      <p>This dataset requires additional authentication. Please login with Globus.</p>
      <b-button class="btn btn-primary" @click="loginWithGlobus">Login with Globus</b-button>
    </div>
    <div v-else>
      <b-button class="btn btn-primary" @click="logoutOfGlobus">Logout of Globus</b-button>
      <p>globusToken: {{globusToken}}</p>
      <b-button class="btn btn-primary" @click="logIdentities">Get Globus Identities</b-button>
    </div>
    <div v-if="!userInfo.emailVerified">
      <p>This dataset requires a verified email address.</p>
      <b-button class="btn btn-primary" @click="verifyEmail">Verify Email</b-button>
    </div>  
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
    getGlobusIdentities: {
      type: Function,
      required: true,
    },
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
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
    async logIdentities() {
      const result = await this.getGlobusIdentities(this.globusToken);
      console.log(result);
    },
    verifyEmail() {
      this.$router.push({ name: 'Profile' });
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