<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="sessionsPassFail">
      <div>
        <p>Download a CSV file listing Session, T1, T2, Atlas, fMRI, All. 1 for pass, 0 for fail.</p>
        <b-button @click="generateCSV">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-filetype-csv" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.517 14.841a1.13 1.13 0 0 0 .401.823c.13.108.289.192.478.252.19.061.411.091.665.091.338 0 .624-.053.859-.158.236-.105.416-.252.539-.44.125-.189.187-.408.187-.656 0-.224-.045-.41-.134-.56a1.001 1.001 0 0 0-.375-.357 2.027 2.027 0 0 0-.566-.21l-.621-.144a.97.97 0 0 1-.404-.176.37.37 0 0 1-.144-.299c0-.156.062-.284.185-.384.125-.101.296-.152.512-.152.143 0 .266.023.37.068a.624.624 0 0 1 .246.181.56.56 0 0 1 .12.258h.75a1.092 1.092 0 0 0-.2-.566 1.21 1.21 0 0 0-.5-.41 1.813 1.813 0 0 0-.78-.152c-.293 0-.551.05-.776.15-.225.099-.4.24-.527.421-.127.182-.19.395-.19.639 0 .201.04.376.122.524.082.149.2.27.352.367.152.095.332.167.539.213l.618.144c.207.049.361.113.463.193a.387.387 0 0 1 .152.326.505.505 0 0 1-.085.29.559.559 0 0 1-.255.193c-.111.047-.249.07-.413.07-.117 0-.223-.013-.32-.04a.838.838 0 0 1-.248-.115.578.578 0 0 1-.255-.384h-.765ZM.806 13.693c0-.248.034-.46.102-.633a.868.868 0 0 1 .302-.399.814.814 0 0 1 .475-.137c.15 0 .283.032.398.097a.7.7 0 0 1 .272.26.85.85 0 0 1 .12.381h.765v-.072a1.33 1.33 0 0 0-.466-.964 1.441 1.441 0 0 0-.489-.272 1.838 1.838 0 0 0-.606-.097c-.356 0-.66.074-.911.223-.25.148-.44.359-.572.632-.13.274-.196.6-.196.979v.498c0 .379.064.704.193.976.131.271.322.48.572.626.25.145.554.217.914.217.293 0 .554-.055.785-.164.23-.11.414-.26.55-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.764a.799.799 0 0 1-.118.363.7.7 0 0 1-.272.25.874.874 0 0 1-.401.087.845.845 0 0 1-.478-.132.833.833 0 0 1-.299-.392 1.699 1.699 0 0 1-.102-.627v-.495Zm8.239 2.238h-.953l-1.338-3.999h.917l.896 3.138h.038l.888-3.138h.879l-1.327 4Z"/></svg>
        </b-button>
        <apexchart type="bar" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
      </div>
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
  import { saveAs } from 'file-saver';
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
        /**
         * data to be turned into a csv output
         */
        passedSessions: {},
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
        // console.time('sessionsPassFail');
        // console.log('sessionsPassFail start');
        this.loading = true;
        // db
        const dbRef = this.db.ref(`datasets/${dataset}/votes`);
        const snap = await dbRef.once('value');
        // RegEx
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const funcRegEx = RegExp('_task');
        const atlasRegEx = RegExp('Atlas');
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

          let modality = '';
          if (key.match(funcRegEx)) {
            modality = 'fMRI';
          } else if (key.match(atlasRegEx)) {
            modality = 'Atlas'
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
            sampleResult[Object.keys(value)] = sampleResult.hasOwnProperty(Object.keys(value)) ? sampleResult[Object.keys(value)] && Object.values(value) >= threshold : Object.values(value) >= threshold;
            return sampleResult;
          }, {});
          const hasFalse = Object.values(reducedSample).some(value => !value);
          reducedSample.All = !hasFalse;
          result[session] = reducedSample;
          return result;
        }, {})
        this.passedSessions = meetsThreshold;

        const numberOfPassFailSessionsByModality = _.reduce(meetsThreshold, function(result, value, key){
          Object.keys(value).forEach(modality => {
            if (value[modality]) {
              result[modality]['Pass'] += 1;
            } else {
              result[modality]['Fail'] += 1;
            }
          });
          return result;
        },{'T1':{'Pass':0, 'Fail':0}, 'T2':{'Pass':0, 'Fail':0}, 'Atlas':{'Pass':0, 'Fail':0}, 'fMRI':{'Pass':0, 'Fail':0}, 'All':{'Pass':0, 'Fail':0}, 'Other':{'Pass':0, 'Fail':0}});

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
            categories: ['T1', 'T2', 'Atlas', 'fMRI', 'All'],
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
            data: [numberOfPassFailSessionsByModality['T1']['Pass'], numberOfPassFailSessionsByModality['T2']['Pass'], numberOfPassFailSessionsByModality['Atlas']['Pass'], numberOfPassFailSessionsByModality['fMRI']['Pass'], numberOfPassFailSessionsByModality['All']['Pass']],
          },
          {
            name: 'Number of Failed Sessions',
            data: [numberOfPassFailSessionsByModality['T1']['Fail'], numberOfPassFailSessionsByModality['T2']['Fail'], numberOfPassFailSessionsByModality['Atlas']['Fail'], numberOfPassFailSessionsByModality['fMRI']['Fail'], numberOfPassFailSessionsByModality['All']['Fail']],
          },
        ];


        this.chartOptions = options;
        this.chartSeries = series;

        this.loading = false;
        // console.timeEnd('sessionsPassFail');
        /* eslint-enable */
      },
      generateCSV() {
        /* eslint-disable */
        const csv = _.reduce(this.passedSessions, function(result, value, key){
          const T1 = value.hasOwnProperty('T1') ? value['T1'] ? 1 : 0 : '';
          const T2 = value.hasOwnProperty('T2') ? value['T2'] ? 1 : 0 : '';
          const Atlas = value.hasOwnProperty('Atlas') ? value['Atlas'] ? 1 : 0 : '';
          const fMRI = value.hasOwnProperty('fMRI') ? value['fMRI'] ? 1 : 0 : '';
          const All = value.hasOwnProperty('All') ? value['All'] ? 1 : 0 : '';
          result += `${key},${T1},${T2},${Atlas},${fMRI},${All}\n`;
          return result;
        },'Session,T1,T2,Atlas,fMRI,All\n');
        /* eslint-enable */
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `BrainSwipes-${this.dataset}-session-results.csv`);
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