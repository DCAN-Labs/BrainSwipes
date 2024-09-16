<template>
  <div class="dataset-select">
    <div>
      <html>
        <b-button @click="toggleShowDatasets">
          Toggle Datasets
        </b-button>
      </html> 
    </div>
    <div v-if="showUnavailable" class="buttons">
      <div v-for="study in Object.keys(config.studies)" :key="study">
        <b-button v-if="study !== 'TEST'" :class="datasetPrivileges[study] ? 'btn-swipes' : 'btn-unavailable'" @click="chooseStudy(study)">{{study}}</b-button>
      </div>
      <b-button v-if="datasetPrivileges['TEST']" class="btn-swipes" @click="chooseStudy('TEST')">TEST</b-button>
        <li>Unavailable</li>
    </div>
    <div v-else class="buttons">
      <div v-for="study in Object.keys(config.studies)" :key="study">
        <b-button v-if="datasetPrivileges[study]" class="btn-swipes" @click="chooseStudy(study)">{{study}}</b-button>
        <li>Avalable</li>
      </div>
    </div>
    <hr class="seperator">
    <div v-if="showDatasets">
      <div v-if="showGlobusLogin">
        <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{config.errorCodes[error]}}</p>
      </div>
      <div class="buttons" v-else>
        <div v-for="dataset in config.studies[selectedStudy].datasets" :key="dataset">
          <b-button
            :class="config.datasets[dataset].archived && surpressArchived ? 'btn-unavailable' : datasetPrivileges[selectedStudy] ? 'btn-swipes' : 'btn-unavailable'"
            @click="chooseDataset(dataset)"
          >
            {{config.datasets[dataset].name}}
          </b-button>
        </div>
      </div>
    </div>
    <GlobusAuth
      :globusToken="globusToken"
      :getGlobusIdentities="getGlobusIdentities"
      :userInfo="userInfo"
      :config="config"
      :redirectPath="redirectPath"
      :redirectComponent="redirectComponent"
      :showGlobusLogin="showGlobusLogin"
      @globusLogin="globusLogin"
    />
  </div>
</template>

<script>
import firebase from 'firebase/app';
import GlobusAuth from './GlobusAuth';

export default {
  name: 'DatasetSelect',
  components: {
    GlobusAuth,
  },
  data() {
    return {
      selectedDataset: '',
      /**
       * the selected study
       */
      selectedStudy: '',
      /**
       * whether to show the dataset buttons
       */
      showDatasets: false,
      /**
       * Whether the user has authenticated with Globus
       */
      globusAuthenticated: false,
      globusAuthErrors: [],
    };
  },
  props: {
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
    /**
     * the configuration from firebase
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * the studies the user is allowed to see
     */
    datasetPrivileges: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    /**
     * changes the behavior of datasets that are archived
     */
    surpressArchived: {
      type: Boolean,
      required: true,
    },
    /**
     * shows datasets the user doesn't have permission to see
     */
    showUnavailable: {
      type: Boolean,
      required: true,
    },
    /**
     * whether globus authentication is enforced in this step
     *
     * should be true unless the parent component redirects
     * to another page that authenticates with Globus
     */
    useGlobus: {
      type: Boolean,
      required: true,
    },
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
    /**
     * the path used in the GLobus app redirect process
     */
    redirectPath: {
      type: String,
      required: true,
    },
    /**
     * the component to redirect to after Globus Auth
     */
    redirectComponent: {
      type: String,
      required: true,
    },
  },
  methods: {
    chooseStudy(study) {
      if (this.selectedStudy === study) {
        this.showDatasets = false;
        this.selectedStudy = '';
      } else {
        this.selectedStudy = study;
        this.selectedDataset = '';
        this.showDatasets = true;
        this.$emit('activateStudy', this.selectedStudy);
      }
    },
    chooseDataset(dataset) {
      this.selectedDataset = dataset;
      this.$emit('activateDataset', this.selectedStudy, this.selectedDataset);
      this.selectedStudy = '';
      this.showDatasets = false;
    },
    toggleShowDatasets() {
      this.showDatasets = !this.showDatasets;
    },
    async allowRestrictedDatasets() {
      if (this.globusToken.length) {
        const user = firebase.auth().currentUser;
        const email = user.email;
        const response = await this.getGlobusIdentities(this.globusToken);
        const identities = response.identities;
        const identityProviders = response.included.identity_providers;
        const errors = [];
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const organization = idTokenResult.claims.org;
        // check to see if the email in swipes is linked to the globus account
        let hasSwipesEmail = false;
        identities.forEach((identity) => {
          let identityEmail = '';
          if (Object.hasOwn(identity, 'email')) {
            if (identity.email != null) {
              identityEmail = identity.email.toString();
            }
          }
          if (identityEmail.toLowerCase() === email.toLowerCase()) {
            hasSwipesEmail = true;
          }
        });
        // check to see if the organiztion the user is registered with
        // is linked to the globus account
        let hasOrg = false;
        let orgUsed = false;
        identityProviders.forEach((provider) => {
          if (provider.name === organization) {
            hasOrg = true;
            const domains = provider.domains;
            identities.forEach((identity) => {
              let identityEmail = '';
              if (Object.hasOwn(identity, 'email')) {
                if (identity.email != null) {
                  identityEmail = identity.email;
                }
              }
              domains.forEach((domain) => {
                if (identityEmail.includes(domain)) {
                  if (identity.status === 'used') {
                    orgUsed = true;
                  }
                }
              });
            });
          }
        });
        if (identities.length === 0) {
          errors.push('noIdentities');
        } else if (!hasSwipesEmail) {
          errors.push('noSwipesEmail');
        } else if (!hasOrg) {
          errors.push('noSwipesOrg');
        } else if (!orgUsed) {
          errors.push('orgNotUsed');
        }
        if (errors.length) {
          this.globusAuthErrors = errors;
          this.globusAuthenticated = false;
        } else {
          this.globusAuthenticated = true;
        }
      }
    },
    globusLogin(accessToken) {
      this.$emit('globusLogin', accessToken);
    },
  },
  mounted() {
    console.log('datasetPrivileges:', this.datasetPrivileges);
    this.allowRestrictedDatasets();
  },
  computed: {
    showGlobusLogin() {
      let showGlobusLogin = false;
      if (this.showDatasets) {
        if (this.showUnavailable) {
          showGlobusLogin = !this.config.studies[this.selectedStudy].available
            && !this.globusAuthenticated
            && this.useGlobus
            && this.datasetPrivileges[this.selectedStudy];
        } else {
          showGlobusLogin = !this.config.studies[this.selectedStudy].available
            && !this.globusAuthenticated
            && this.useGlobus;
        }
      }
      return showGlobusLogin;
    },
  },
};
</script>

<style scoped>
  .buttons {
    text-align: center;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>