<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="sessionsPassFail">
      <apexchart type="bar" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
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
    name: 'sessionsPassFail',
    data() {
      return {
        /**
         * whether the chart is loading
         */
        loading: true,
        /**
         * elements for building the chart
         */
        chartOptions: {},
        chartSeries: {},
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
       * threshold considered a pass
       */
      threshold: {
        type: Number,
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
      async createChart(dataset, excludedUsers, threshold, minSwipes) {
        /* eslint-disable */
        console.time('sessionsPassFail');
        console.log('sessionsPassFail start');
        this.loading = true;
        // db
        const dbRef = this.db.ref(`datasets/${dataset}/votes`);
        const snap = await dbRef.once('value');
        // RegEx
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const restRegEx = RegExp('rest');
        // format excluded users for use in jsonQuery
        const userQuery = excludedUsers.map(user => `user!=${user}`).join(' && ');
        // query db snapshot
        const query = jsonQuery(`[**][* ${userQuery}]`, { data: snap.val() });
        // parse data
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
          let ses = '';
          try {
            ses = key.substring(0, key.match(this.labelsRegex).index);
          } catch (error) {
            console.log(key);
            console.log(error);
          }

          let modality = ''; // do we want atlas registrations seperate?
          if (key.match(restRegEx)) {
            modality = 'Rest'; // should this be 'Task'?
          } else if (key.match(t1RegEx)) {
            modality = 'T1';
          } else if (key.match(t2RegEx)) {
            modality = 'T2';
          } else {
            modality = 'Other';
          }
          ses ? (result[ses] || (result[ses] = [])).push({ [modality]: value }) : null;
          return result;
        }, {});

        const meetsThreshold = _.reduce(reducedBySession, (result, modalities, session) => {
          const reducedSample = _.reduce(modalities, (sampleResult, value) => {
            sampleResult[Object.keys(value)] = Object.values(value) >= threshold;
            return sampleResult;
          }, {});
          const hasFalse = Object.values(reducedSample).some(value => !value);
          reducedSample.All = !hasFalse;
          result[session] = reducedSample;
          return result;
        }, {})

        const numberOfPassFailSessionsByModality = _.reduce(meetsThreshold, function(result, value, key){
          Object.keys(value).forEach(modality => {
            if (value[modality]) {
              result[modality]['Pass'] += 1;
            } else {
              result[modality]['Fail'] += 1;
            }
          });
          return result;
        },{'T1':{'Pass':0, 'Fail':0}, 'T2':{'Pass':0, 'Fail':0}, 'Rest':{'Pass':0, 'Fail':0}, 'All':{'Pass':0, 'Fail':0}, 'Other':{'Pass':0, 'Fail':0}});

        console.log(numberOfPassFailSessionsByModality);
        // create the chart
        const options = {
          chart: {
            height: 350,
            type: 'bar',
            stacked: true,
            stackType: '100%',
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: false,
            }
          },
          dataLabels: {
            enabled: true,
          },
          title: {
            text: 'Number of Sessions by Pass/Fail',
          },
          xaxis: {
            categories: ['T1', 'T2', 'Rest', 'All'],
          },
          states: {
            active: {
              filter: {
                type: 'none',
                value: 0,
              },
            },
          },
        };

        const series = [
          {
            name: 'Number of Passed Sessions',
            data: [numberOfPassFailSessionsByModality['T1']['Pass'], numberOfPassFailSessionsByModality['T2']['Pass'], numberOfPassFailSessionsByModality['Rest']['Pass'], numberOfPassFailSessionsByModality['All']['Pass']],
          },
          {
            name: 'Number of Failed Sessions',
            data: [numberOfPassFailSessionsByModality['T1']['Fail'], numberOfPassFailSessionsByModality['T2']['Fail'], numberOfPassFailSessionsByModality['Rest']['Fail'], numberOfPassFailSessionsByModality['All']['Fail']],
          },
        ];


        this.chartOptions = options;
        this.chartSeries = series;

        this.loading = false;
        console.timeEnd('sessionsPassFail');
        /* eslint-enable */
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.excludedUsers, this.threshold, this.minSwipes];
      },
      labelsRegex() {
        return new RegExp(labels.join('|'));
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createChart(this.dataset, this.excludedUsers, this.threshold, this.minSwipes);
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>