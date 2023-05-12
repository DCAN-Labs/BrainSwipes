<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="survivingSessions">
      <apexchart type="line" height="350" :options="chartOptions" :series="series"></apexchart>
    </div>
  </div>
</template>

<style>

</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';
  import jsonQuery from 'json-query';
  import { labels } from '../../labels';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'survivingSessions',
    data() {
      return {
        /**
         * whether the chart is loading
         */
        loading: true,
        /**
         * elements for building the chart
         */
        chartOptions: {
          chart: {
            height: 350,
            type: 'line',
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Number of Surviving Scans at Different Slice Rating Thresholds',
          },
        },
        series: {},
      };
    },
    props: {
      /**
       * the intialized firebase database
       */
      db: {
        type: Object,
        required: true,
      },
      /**
       * the dataset to visualize
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * list of users to exclude from the chart data
       */
      excludedUsers: {
        type: Array,
        required: true,
      },
      /**
       * minimum number of swipes on a slice to be included in the chart data
       */
      minSwipes: {
        type: Number,
        required: true,
      },
      /**
       * minimum ratio of passes to swipes to be considered a pass for a slice
       */
      sliceThreshold: {
        type: Number,
        required: true,
      },
    },
    methods: {
      async createChart(dataset, excludedUsers, minSwipes) {
        /* eslint-disable */
        // console.time('survivingSessions');
        // console.log('survivingSessions start');
        this.loading = true;
        // RegEx
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const funcRegEx = RegExp('_task');
        const atlasRegEx = RegExp('Atlas');
        const runRegEx = RegExp('_(run-\\d*?)_');
        // db
        const dbRef = this.db.ref(`datasets/${dataset}/votes`);
        const snap = await dbRef.once('value');
        // format excluded users for use in jsonQuery
        const userQuery = excludedUsers.map(user => `user!=${user}`).join(' && ');
        // query db snapshot
        const query = jsonQuery(`[**][* ${userQuery}]`, { data: snap.val() });
        // reduce query
        const reducedBySample = _.reduce(query.references[0], (result, value) => {
          const sample = value.sample;
          (result[sample] || (result[sample] = [])).push(value.response);
          return result;
        }, {});

        const removeLowSwipeCounts = _.reduce(reducedBySample, function(result, value, key){
            if (value.length >= minSwipes) {
                result[key] = value;
            }
            return result;
        }, {});

        const averageScoreBySample = _.mapValues(removeLowSwipeCounts, o => _.mean(o));

        const reducedByScan = _.reduce(averageScoreBySample, (result, value, key) => {
          let ses = '';
          try {
            ses = key.substring(0, key.match(this.labelsRegex).index);
          } catch (error) {
            console.log(key);
            console.log(error);
          }

          let modality = '';
          if (key.match(funcRegEx)) {
            if (key.match(runRegEx)) {
              const run = key.match(runRegEx)[1];
              modality = `fMRI_${run}`;
            } else {
              modality = 'fMRI';
            }
          } else if (key.match(atlasRegEx)) {
            if (key.match(runRegEx)) {
              const run = key.match(runRegEx)[1];
              modality = `Atlas_${run}`;
            } else {
              modality = 'Atlas'
            }
          } else if (key.match(t1RegEx)) {
            if (key.match(runRegEx)) {
              const run = key.match(runRegEx)[1];
              modality = `T1_${run}`;
            } else {
              modality = 'T1';
            }
          } else if (key.match(t2RegEx)) {
            if (key.match(runRegEx)) {
              const run = key.match(runRegEx)[1];
              modality = `T2_${run}`;
            } else {
              modality = 'T2';
            }
          } else {
            modality = 'Other';
          }
          ses ? result[ses] ? (result[ses][modality] || (result[ses][modality] = [])).push(value) : result[ses] = { [modality]: [value] } : null;
          return result;
        }, {});

        const minBySession = _.reduce(reducedByScan, (result, scans, session) => {
          const minByScan = _.mapValues(scans, scan => _.min(scan));
          result[session] = minByScan;
          return result;
        }, {});

        const collapseRuns = _.reduce(minBySession, (result, scans, session) => {
          const runs = {};
          Object.keys(scans).forEach(scan => {
            const modality = this.findModality(scan);
            runs[modality] = runs[modality] || {};
            runs[modality][scans[scan]] = (runs[modality][scans[scan]] || 0) + 1;
          });
          result[session] = runs;
          return result;
        }, {});

        const ratingsByModality = _.reduce(collapseRuns, (result, modalities, session) => {
          Object.keys(modalities).forEach(modality => {
            Object.keys(modalities[modality]).forEach(ratio => {
              result[modality][ratio] = (result[modality][ratio] || 0) + modalities[modality][ratio];
            });
          });
          return result;
        }, { T1: {}, T2: {}, Atlas: {}, fMRI: {} });

        const numSamplesPerThreshold = _.reduce(ratingsByModality, (outerResult, scores, modality) => {
          const modalityThresholds = _.reduce(scores, (result, value, key) => {
            for (let i = 0; i < 105; i += 5) {
              if (key >= i / 100) {
                result[i] += value;
              }
            }
            return result;
          }, { 0: 0, 5: 0, 10: 0, 15: 0, 20: 0, 25: 0, 30: 0, 35: 0, 40: 0, 45: 0, 50: 0, 55: 0, 60: 0, 65: 0, 70: 0, 75: 0, 80: 0, 85: 0, 90: 0, 95: 0, 100: 0 });
          outerResult[modality] = modalityThresholds;
          return outerResult;
        }, { T1: {}, T2: {}, Atlas: {}, fMRI: {}});

        const thresholdsAsPairs = _.reduce(numSamplesPerThreshold, (result, value, key) => {
          result[key] = _.toPairs(value);
          return result;
        }, {});

        const thresholdsAsInt = _.reduce(thresholdsAsPairs, function(outerResult, outerValue, outerKey){
          const thresholdAsInt = _.reduce(outerValue, function(result, value){
              result.push(_.map(value, _.parseInt));
              return result;
          }, []);
          outerResult[outerKey] = thresholdAsInt;
          return outerResult;
        }, {});

        this.series = [{
          name: 'T1',
          data: thresholdsAsInt.T1,
        }, {
          name: 'T2',
          data: thresholdsAsInt.T2,
        }, {
          name: 'fMRI',
          data: thresholdsAsInt.fMRI,
        }, {
          name: 'Atlas',
          data: thresholdsAsInt.Atlas,
        }];
        this.loading = false;
        // console.timeEnd('survivingSessions');
        /* eslint-enable */
      },
      findModality(key) {
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const fMRIRegEx = RegExp('fMRI');
        const atlasRegEx = RegExp('Atlas');

        let modality = '';
        if (key.match(fMRIRegEx)) {
          modality = 'fMRI';
        } else if (key.match(atlasRegEx)) {
          modality = 'Atlas';
        } else if (key.match(t1RegEx)) {
          modality = 'T1';
        } else if (key.match(t2RegEx)) {
          modality = 'T2';
        } else {
          modality = 'Other';
        }
        return modality;
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.excludedUsers, this.minSwipes];
      },
      labelsRegex() {
        return new RegExp(labels.join('|'));
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createChart(this.dataset, this.excludedUsers, this.minSwipes);
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>