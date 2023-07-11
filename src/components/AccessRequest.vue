<template>
  <div id="access-request">
    <h1> Request Study Access </h1>
    <br>
    <div id="access-request-form" v-if="globusToken">
      <b-card v-if="!submitted" title="Study Access Request Form" sub-title="Fill out this form to gain access to a restricted study">
        <b-form-group label="Study" label-for="selectStudy" label-cols="4">
          <b-form-select id="selectStudy" v-model="selectedStudy" :options="restrictedStudies"></b-form-select>
        </b-form-group>
        <b-form-group label-cols="4" label="Full Name" label-for="name">
          <b-form-input v-model="submittedName" id="name"></b-form-input>
        </b-form-group>
        <b-form-group label-cols="4" label="Username" label-for="username">
          <b-form-input id="username" readonly v-model="userInfo.displayName"></b-form-input>
        </b-form-group>
        <b-form-group label-cols="4" label="Email" label-for="email">
          <b-form-input id="email" readonly v-model="userInfo.email"></b-form-input>
        </b-form-group>
        <b-form-group label="Organization" label-for="selectGlobusOrg" label-cols="4" description="This should be the organization you are a member of for purposes of this study's data use agreement.">
          <b-form-select id="selectGlobusOrg" v-model="globusOrg" :options="globusOrgs"></b-form-select>
        </b-form-group>
        <b-button @click="onSubmit" :disabled="!(selectedStudy && submittedName)">Submit</b-button>
      </b-card>
      <div v-else>
        <p>You have successfully submitted a request to access {{selectedStudy}}.</p>
        <b-button variant="warning" @click="formReset">Submit another request</b-button>
      </div>
    </div>
    <div v-else>
      <p>You must log in with Globus to submit a request</p>
      <br>
      <GlobusAuth
        :globusToken="globusToken"
        :getGlobusIdentities="getGlobusIdentities"
        :userInfo="userInfo"
        :config="config"
        redirectPath="access-request"
        redirectComponent="AccessRequest"
        showGlobusLogin="true"
        @globusLogin="globusLogin"
      />
    </div>
  </div>

</template>

<style scoped>
#access-request-form{
  display: flex;
  justify-content: center;
}
</style>

<script>

/**
 * Route for requesting access to a restricted dataset.
 */
import firebase from 'firebase/app';
import 'firebase/auth';
import _ from 'lodash';
import GlobusAuth from './Widgets/GlobusAuth';

export default {
  name: 'access-request',
  components: {
    GlobusAuth,
  },
  data() {
    return {
      globusOrg: '',
      selectedStudy: '',
      submittedName: '',
      globusOrgs: [],
      restrictedStudies: [],
      submitted: false,
    };
  },
  props: {
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
    /**
     * the config document from firebase
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
    /**
     * The auth token from Globus
     */
    globusToken: {
      type: String,
      required: true,
    },
    /**
     * function that exchanges the Globus token for user information
     */
    getGlobusIdentities: {
      type: Function,
      required: true,
    },
  },
  methods: {
    onSubmit() {
      // submit info to database
      const formInfo = {
        study: this.selectedStudy,
        org: this.globusOrg,
        username: this.userInfo.displayName,
        email: this.userInfo.email,
        name: this.submittedName,
        timestamp: Date.now(),
        organizations: this.globusOrgs,
        status: 'awaiting',
      };
      this.db.ref(`requests/${this.selectedStudy}/${this.userInfo.displayName}`).set(formInfo);
      this.submitted = true;
    },
    formReset() {
      this.globusOrg = '';
      this.submittedName = '';
      this.selectedStudy = '';
      this.submitted = false;
    },
    async getIdentites() {
      if (this.globusToken) {
        const identities = await this.getGlobusIdentities(this.globusToken);
        const email = this.userInfo.email;
        if (Object.hasOwn(identities, email)) {
          this.globusOrg = identities[email][0];
        }
        const organizations = [];
        Object.keys(identities).forEach((identity) => {
          organizations.push(identities[identity][0]);
        });
        this.globusOrgs = organizations;
      }
    },
    routeToRestricted() {
      this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
    },
    async getRestrictedStudies() {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const studies = idTokenResult.claims.datasets;
      delete studies.TEST;
      const requestableStudies = Object.keys(
        _.pickBy(studies, (v, k) => !v && k !== 'TEST'));
      this.restrictedStudies = requestableStudies;
    },
    globusLogin(accessToken) {
      this.$emit('globusLogin', accessToken);
    },
  },
  mounted() {
    this.getIdentites();
    this.getRestrictedStudies();
  },
};
</script>
