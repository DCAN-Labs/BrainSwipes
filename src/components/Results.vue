<template>
  <div id="results">
      <h1>Choose a study to download up to date QC data.</h1>
      <p>Data is in csv format with columns for sample name, average vote and number of swipes.</p>
      <div id="studies" v-for="study in Object.keys(datasetPrivileges)" :key="study">
        <b-button class="studies" v-if="datasetPrivileges[study]" @click="selectStudy(study)">{{study}}</b-button>
      </div>
      <div v-if="selectedStudy.length">
          <hr>
          <h1>Click below to download a CSV file of data from {{selectedStudy}}</h1>
        <b-button v-if="!working" @click="downloadCSV()"><img id="csv" v-if="selectedStudy" src="../assets/export-csv.png"></b-button>
        <Flask v-else/>
      </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { saveAs } from 'file-saver';
import Flask from './Animations/Flask';

export default {
  name: 'Results',
  data() {
    return {
      selectedStudy: '',
      working: false,
      json: {},
    };
  },
  props: {
    datasetPrivileges: {
      type: Object,
      required: true,
    },
    db: {
      type: Object,
      required: true,
    },
    globusToken: {
      type: String,
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
  },
  components: {
    Flask,
  },
};
</script>

<style>
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
</style>