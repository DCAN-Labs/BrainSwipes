<template>
  <div class="dataset-select">
    <div v-if="showUnavailable" class="buttons">
      <div v-for="study in Object.keys(config.studies)" :key="study">
        <b-button v-if="study !== 'TEST'" :class="datasetPrivileges[study] ? 'btn-swipes' : 'btn-unavailable'" @click="chooseStudy(study)">{{study}}</b-button>
      </div>
      <b-button v-if="datasetPrivileges['TEST']" class="btn-swipes" @click="chooseStudy('TEST')">TEST</b-button>
    </div>
    <div v-else class="buttons">
      <div v-for="study in Object.keys(config.studies)" :key="study">
        <b-button v-if="datasetPrivileges[study]" class="btn-swipes" @click="chooseStudy(study)">{{study}}</b-button>
      </div>
    </div>
    <hr class="seperator">
    <div v-if="showDatasets">
      <div v-if="!config.studies[selectedStudy].available && !globusAuthenticated && useGlobus">
        <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{errorCodes[error]}}</p>
        <b-button @click="routeToRestricted">Login with Globus</b-button>
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
  </div>
</template>

<script>
import firebase from 'firebase/app';

export default {
  name: 'DatasetSelect',
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
     * errors produced by brainswipes
     */
    errorCodes: {
      type: Object,
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
    async allowRestrictedDatasets() {
      const user = firebase.auth().currentUser;
      const email = user.email;
      const identities = await this.getGlobusIdentities(this.globusToken);
      const errors = [];
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const organization = idTokenResult.claims.org;
      if (Object.keys(identities).length === 0) {
        errors.push(1);
      } else if (!identities[email]) {
        errors.push(2);
      } else if (identities[email][0] !== organization) {
        errors.push(3);
      } else if (identities[email][1] !== 'used') {
        errors.push(4);
      }
      if (errors.length) {
        this.globusAuthErrors = errors;
        this.globusAuthenticated = false;
      } else {
        this.globusAuthenticated = true;
      }
    },
    routeToRestricted() {
      this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
    },
  },
  mounted() {
    this.allowRestrictedDatasets();
  },
};
</script>

<style scoped>
  .buttons {
    text-align: center;
    display: flex;
    justify-content: center;
  }
</style>