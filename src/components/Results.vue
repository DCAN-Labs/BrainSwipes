<template>
  <div id="results">
      <h1>Choose a study to download up to date QC data.</h1>
      <p>Data is in csv format with columns for sample name, average vote and number of swipes.</p>
      <DatasetSelect
        :globusToken="globusToken"
        :getGlobusIdentities="getGlobusIdentities"
        :errorCodes="errorCodes"
        :config="config"
        :datasetPrivileges="datasetPrivileges"
        :surpressArchived="false"
        :showUnavailable="false"
        :useGlobus="true"
        @activateDataset="activateDataset"
      />
      <div v-if="dataset">
        <h1>Click below to download a CSV file of data from {{config.datasets[dataset].name}}</h1>
        <b-button v-if="!working" @click="downloadCSV()"><img id="csv" src="../assets/export-csv.png"></b-button>
        <Flask v-else/>
      </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { saveAs } from 'file-saver';
import Flask from './Animations/Flask';
import DatasetSelect from './Widgets/DatasetSelect';

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
    jsonToCsv(result, value, key) {
      const string = `${key},${value.aveVote},${value.count}\n`;
      return result + string;
    },
    downloadCSV() {
      this.working = true;
      this.db.ref(`/datasets/${this.dataset}/sampleSummary`).once('value').then((snap) => {
        const json = snap.val();
        const csvContent = _.reduce((json), this.jsonToCsv, 'sample,aveVote,count\n');
        const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `BrainSwipes-${this.config.datasets[this.dataset].name}-results.csv`);
        this.working = false;
      });
    },
    activateDataset(study, dataset) {
      this.dataset = dataset;
    },
  },
  components: {
    Flask,
    DatasetSelect,
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
</style>