<template>
  <div id="access-request">
    <h1> Request Study Access </h1>
    <br>
    <div id="access-request-form" v-if="globusToken">
      <b-card title="Study Access Request Form" sub-title="Fill out this form to gain access to a restricted study">
        <b-form-group label="Study" label-for="selectStudy" label-cols="4">
          <b-form-select id="selectStudy" v-model="selectedStudy" :options="restrictedStudies"></b-form-select>
        </b-form-group>
        <b-form-group label-cols="4" label="Full Name" label-for="name">
          <b-form-input v-model="submittedName" id="name"></b-form-input>
        </b-form-group>
        <b-form-group label-cols="4" label="Username" label-for="username">
          <b-form-input id="username" readonly v-model="userInfo.displayName"></b-form-input>
        </b-form-group>
        <b-form-group label-cols="4" label="Email" label-for="email" description="The email you used to register your BrainSwipes account. This will determine what Globus identity we use.">
          <b-form-input id="email" readonly v-model="userInfo.email"></b-form-input>
        </b-form-group>
        <b-form-group label="Organization" label-for="selectGlobusOrg" label-cols="4" description="This should be the organization you are a member of for purposes of this study's data use agreement.">
          <b-form-input id="selectGlobusOrg" readonly v-model="globusOrg"></b-form-input>
        </b-form-group>
        <b-button @click="onSubmit" :disabled="!(selectedStudy && submittedName)">Submit</b-button>
      </b-card>
    </div>
    <div v-else>
      <p>You must log in with Globus to submit a request</p>
      <br>
      <b-button variant="warning" @click="routeToRestricted">To Globus Login Page</b-button>
    </div>

  </div>

</template>

<style>
#access-request-form{
  display: flex;
  justify-content: center;
}
</style>

<script>

/**
 * Route for requesting access to a restricted dataset.
 */
import _ from 'lodash';

export default {
  name: 'access-request',
  data() {
    return {
      globusOrg: '',
      selectedStudy: '',
      submittedName: '',
    };
  },
  methods: {
    onSubmit() {
      const formInfo = {
        study: this.selectedStudy,
        org: this.globusOrg,
        username: this.userInfo.displayName,
        name: this.submittedName,
        timestamp: Date.now(),
      };
      console.log(formInfo);
    },
    async getIdentites() {
      const identities = await this.getGlobusIdentities(this.globusToken);
      const email = this.userInfo.email;
      this.globusOrg = identities[email][0];
    },
    routeToRestricted() {
      this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
    },
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
  computed: {
    restrictedStudies() {
      const restrictedStudies = Object.keys(
        _.pickBy(this.config.studies, (v, k) => !v.available && k !== 'TEST'));
      return restrictedStudies;
    },
  },
  mounted() {
    this.getIdentites();
  },
};
</script>
