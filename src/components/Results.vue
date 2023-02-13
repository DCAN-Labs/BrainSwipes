<template>
  <div id="results">
      <h1>Choose a study to download up to date QC data.</h1>
      <p>Data is in csv format with columns for sample name, average vote and number of swipes.</p>
      <div class="buttons">
        <div v-for="study in Object.keys(config.studies)" :key="study">
          <b-button v-if="datasetPrivileges[study]" class="btn-primary" @click="chooseStudy(study)">{{study}}</b-button>
        </div>
      </div>
      <hr class="seperator">
      <div v-if="showDatasets">
        <div v-if="!config.studies[selectedStudy].available && !globusAuthenticated">
          <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{errorCodes[error]}}</p>
          <b-button @click="routeToRestricted">Login with Globus</b-button>
        </div>
        <div class="buttons" v-else>
          <div v-for="dataset in config.studies[selectedStudy].datasets" :key="dataset">
            <b-button :class="config.datasets[dataset].archived ? 'btn-unavailable' : datasetPrivileges[selectedStudy] ? 'btn-primary' : 'btn-unavailable'" @click="chooseDataset(dataset)">{{config.datasets[dataset].name}}</b-button>
          </div>
        </div>
      </div>
      <div v-if="dataset">
        <h1>Click below to download a CSV file of data from {{config.datasets[dataset].name}}</h1>
        <b-button v-if="!working" @click="downloadCSV()"><img id="csv" v-if="selectedStudy" src="../assets/export-csv.png"></b-button>
        <Flask v-else/>
      </div>
  </div>
</template>

<script>
import _ from 'lodash';
import firebase from 'firebase/app';
import { saveAs } from 'file-saver';
import Flask from './Animations/Flask';

export default {
  name: 'Results',
  data() {
    return {
      working: false,
      json: {},
      /**
       * the dataset to get csv for
       */
      dataset: '',
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
    /**
     * errors produced by brainswipes
     */
    errorCodes: {
      type: Object,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
  },
  methods: {
    selectStudy(study) {
      this.selectedStudy = study;
    },
    jsonToCsv(result, value, key) {
      const string = `${key},${value.aveVote},${value.count}\n`;
      return result + string;
    },
    downloadCSV() {
      this.working = true;
      this.db.ref(`/datasets/${this.selectedStudy}/sampleSummary`).once('value').then((snap) => {
        const json = snap.val();
        const csvContent = _.reduce((json), this.jsonToCsv, 'sample,aveVote,count\n');
        const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `BrainSwipes-${this.selectedStudy}-results.csv`);
        this.working = false;
      });
    },
    chooseStudy(study) {
      this.selectedStudy = study;
      this.dataset = '';
      this.showDatasets = true;
    },
    chooseDataset(dataset) {
      this.dataset = dataset;
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
  components: {
    Flask,
  },
};
</script>

<style scoped>
  #csv{
    width:200px;
    height:200px;
  }
  #studies{
    display:inline-block;
  }
  .studies{
      margin: 2px;
  }
  .buttons {
    text-align: center;
    display: flex;
    justify-content: center;
  }
  .btn-primary {
    color: #fff;
    background-color: maroon;
    border-color: maroon;
    margin: 0.1em;
  }
  .btn-unavailable {
    color: #fff;
    background-color: grey;
    border-color: grey;
    margin: 0.1em;
  }
  .globus-auth-error {
    background-color: #F8D7DA;
    padding: 5px;
    margin: 5px;
  }
</style>