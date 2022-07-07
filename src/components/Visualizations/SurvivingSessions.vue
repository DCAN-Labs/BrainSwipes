<template>
  <div>
    <!-- <p>{{labels}}</p> -->
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
  
  console.log(labels);

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
            text: 'Number of Surviving Sessions at Different Rating Cutoffs',
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
       * minimum number of swipes on a sample to be included in the chart data
       */
      minSwipes: {
        type: Number,
        required: true,
      },
    },
    methods: {
      async createChart(dataset, excludedUsers, minSwipes) {
        /* eslint-disable */
        console.time('survivingSessions');
        console.log('survivingSessions start');
        this.loading = true;
        // RegEx
        const sessionRegEx = RegExp('sub-[0-9]{6}_ses-[0-9]*mo');
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const restRegEx = RegExp('rest');
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

        const reducedBySession = _.reduce(averageScoreBySample, (result, value, key) => {
          const ses = key.match(sessionRegEx)[0];
          let modality = '';
          if (key.match(restRegEx)) {
            modality = 'Rest';
          } else if (key.match(t1RegEx)) {
            modality = 'T1';
          } else if (key.match(t2RegEx)) {
            modality = 'T2';
          } else {
            modality = 'Other';
          }
          (result[ses] || (result[ses] = [])).push({ [modality]: value });
          return result;
        }, {});

        const minBySessionModality = _.reduce(reducedBySession, (result, modalities, session) => {
          const reducedSample = _.reduce(modalities, (minimum, value) => {
            minimum[Object.keys(value)] = _.min([(minimum[Object.keys(value)] || 9), Object.values(value)[0]]);
            return minimum;
          }, {});
          const sessionFloor = _.reduce(reducedSample, (innerResult, value) => _.min([innerResult, value]), 9);
          reducedSample.All = sessionFloor;
          result[session] = reducedSample;
          return result;
        }, {});

        const reducedCutoffs = _.reduce(minBySessionModality, (result, value) => {
          result.T1[value.T1] = result.T1[value.T1] ? result.T1[value.T1] + 1 : 1;
          result.T2[value.T2] = result.T2[value.T2] ? result.T2[value.T2] + 1 : 1;
          result.Rest[value.Rest] = result.Rest[value.Rest] ? result.Rest[value.Rest] + 1 : 1;
          result.All[value.All] = result.All[value.All] ? result.All[value.All] + 1 : 1;
          return result;
        }, { T1: {}, T2: {}, Rest: {}, All: {} });

        const numSamplesPerThreshold = _.reduce(reducedCutoffs, (outerResult, scores, modality) => {
          const modalityThresholds = _.reduce(scores, (result, value, key) => {
            for (let i = 0; i < 100; i += 5) {
              if (key >= i / 100) {
                result[i] += value;
              }
            }
            return result;
          }, { 0: 0, 5: 0, 10: 0, 15: 0, 20: 0, 25: 0, 30: 0, 35: 0, 40: 0, 45: 0, 50: 0,55: 0, 60: 0, 65: 0, 70: 0, 75: 0, 80: 0, 85: 0, 90: 0, 95: 0 });
          outerResult[modality] = modalityThresholds;
          return outerResult;
        }, { T1: {}, T2: {}, Rest: {}, All: {} });

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
          name: 'Rest',
          data: thresholdsAsInt.Rest,
        }, {
          name: 'All',
          data: thresholdsAsInt.All,
        }];
        this.loading = false;
        console.timeEnd('survivingSessions');
        /* eslint-enable */
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.excludedUsers, this.minSwipes];
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