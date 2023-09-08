<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="sessionsPassFail">
      <div>
        <p>Download a CSV file listing session, scan type and whether it passed or failed.</p>
        <b-button @click="generateCSV">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-filetype-csv" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.517 14.841a1.13 1.13 0 0 0 .401.823c.13.108.289.192.478.252.19.061.411.091.665.091.338 0 .624-.053.859-.158.236-.105.416-.252.539-.44.125-.189.187-.408.187-.656 0-.224-.045-.41-.134-.56a1.001 1.001 0 0 0-.375-.357 2.027 2.027 0 0 0-.566-.21l-.621-.144a.97.97 0 0 1-.404-.176.37.37 0 0 1-.144-.299c0-.156.062-.284.185-.384.125-.101.296-.152.512-.152.143 0 .266.023.37.068a.624.624 0 0 1 .246.181.56.56 0 0 1 .12.258h.75a1.092 1.092 0 0 0-.2-.566 1.21 1.21 0 0 0-.5-.41 1.813 1.813 0 0 0-.78-.152c-.293 0-.551.05-.776.15-.225.099-.4.24-.527.421-.127.182-.19.395-.19.639 0 .201.04.376.122.524.082.149.2.27.352.367.152.095.332.167.539.213l.618.144c.207.049.361.113.463.193a.387.387 0 0 1 .152.326.505.505 0 0 1-.085.29.559.559 0 0 1-.255.193c-.111.047-.249.07-.413.07-.117 0-.223-.013-.32-.04a.838.838 0 0 1-.248-.115.578.578 0 0 1-.255-.384h-.765ZM.806 13.693c0-.248.034-.46.102-.633a.868.868 0 0 1 .302-.399.814.814 0 0 1 .475-.137c.15 0 .283.032.398.097a.7.7 0 0 1 .272.26.85.85 0 0 1 .12.381h.765v-.072a1.33 1.33 0 0 0-.466-.964 1.441 1.441 0 0 0-.489-.272 1.838 1.838 0 0 0-.606-.097c-.356 0-.66.074-.911.223-.25.148-.44.359-.572.632-.13.274-.196.6-.196.979v.498c0 .379.064.704.193.976.131.271.322.48.572.626.25.145.554.217.914.217.293 0 .554-.055.785-.164.23-.11.414-.26.55-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.764a.799.799 0 0 1-.118.363.7.7 0 0 1-.272.25.874.874 0 0 1-.401.087.845.845 0 0 1-.478-.132.833.833 0 0 1-.299-.392 1.699 1.699 0 0 1-.102-.627v-.495Zm8.239 2.238h-.953l-1.338-3.999h.917l.896 3.138h.038l.888-3.138h.879l-1.327 4Z"/></svg>
        </b-button>
        <hr>
        <p>A scan <span class="pass">passes</span> if all images from the scan <span class="pass">pass</span>.</p>
        <p>If any image from a scan <span class="fail">fails</span>, the scan <span class="fail">fails</span>.</p>
        <apexchart type="bar" height="350" :options="chartOptions" :series="chartSeries"></apexchart>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pass {
  color: #00FF00;
  font-weight: bold;
}
.fail {
  color: #FF0000;
  font-weight: bold;
}
</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';
  import jsonQuery from 'json-query';
  import { saveAs } from 'file-saver';

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
        passedScans: {},
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
      },      /**
       * minimum ratio of passes to swipes to be considered a pass for a sample
       */
      sliceThreshold: {
        type: Number,
        required: true,
      },
    },
    methods: {
      async createChart(dataset, excludedUsers, sliceThreshold, minSwipes) {
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
        // parse data
        const reducedBySample = _.reduce(query.references[0], (result, value) => {
          const sample = value.sample;
          (result[sample] || (result[sample] = [])).push(value.response);
          return result;
        }, {});

        // exclude samples that don't have enough swipes as defined by the user
        const removeLowSwipeCounts = _.reduce(reducedBySample, (result, value, key) => {
          if (value.length >= minSwipes) {
            result[key] = value;
          }
          return result;
        }, {});

        // average the votes of each sample
        const averageScoreBySample = _.mapValues(removeLowSwipeCounts, o => _.mean(o));

        // group samples by session
        const reducedBySession = _.reduce(averageScoreBySample, (result, value, key) => {
          let ses = '';
          const sesRegEx = RegExp('sub-.*_ses.*?_');
          try {
            ses = key.match(sesRegEx);
          } catch (error) {
            console.log(key);
            console.log(error);
          }

          let modality = 'Other';
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
              modality = 'Atlas';
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
          }
          // eslint-disable-next-line no-unused-expressions
          ses ? (result[ses] || (result[ses] = [])).push({ [modality]: value }) : null;
          return result;
        }, {});

        // group by scan and check against minimum vote threshold
        const meetsThreshold = _.reduce(reducedBySession, (result, modalities, session) => {
          const reducedSample = _.reduce(modalities, (sampleResult, value) => {
            sampleResult[Object.keys(value)] =
              Object.hasOwn(sampleResult, Object.keys(value)) ?
              sampleResult[Object.keys(value)] && Object.values(value) >= sliceThreshold :
              Object.values(value) >= sliceThreshold;
            return sampleResult;
          }, {});
          result[session] = reducedSample;
          return result;
        }, {});
        this.passedScans = meetsThreshold;

        // count the number of scans of each modality that pass or fail
        const numberOfPassFailScansByModality =
          _.reduce(
            meetsThreshold,
            (result, value) => {
              Object.keys(value).forEach((modality) => {
                let foundModality = modality;
                const match = modality.match(/(.*)_run/);
                if (match) {
                  foundModality = match[1];
                }
                if (value[modality]) {
                  result[foundModality].Pass += 1;
                } else {
                  result[foundModality].Fail += 1;
                }
              });
              return result;
            },
            {
              T1: { Pass: 0, Fail: 0 },
              T2: { Pass: 0, Fail: 0 },
              Atlas: { Pass: 0, Fail: 0 },
              fMRI: { Pass: 0, Fail: 0 },
              Other: { Pass: 0, Fail: 0 },
            },
          );

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
            },
          },
          dataLabels: {
            enabled: true,
          },
          title: {
            text: 'Number of Scans by Pass/Fail',
          },
          xaxis: {
            categories: ['T1', 'T2', 'Atlas', 'fMRI'],
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
            name: 'Number of Passed Scans',
            data: [
              numberOfPassFailScansByModality.T1.Pass,
              numberOfPassFailScansByModality.T2.Pass,
              numberOfPassFailScansByModality.Atlas.Pass,
              numberOfPassFailScansByModality.fMRI.Pass,
            ],
          },
          {
            name: 'Number of Failed Scans',
            data: [
              numberOfPassFailScansByModality.T1.Fail,
              numberOfPassFailScansByModality.T2.Fail,
              numberOfPassFailScansByModality.Atlas.Fail,
              numberOfPassFailScansByModality.fMRI.Fail,
            ],
          },
        ];


        this.chartOptions = options;
        this.chartSeries = series;

        this.loading = false;
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
      generateCSV() {
        const csv = _.reduce(this.passedScans, (result, scans, session) => {
          const sesLines = _.reduce(scans, (lines, passFail, modality) => {
            const text = `${session},${modality},${passFail}\n`;
            lines += text;
            return lines;
          }, '');
          result += sesLines;
          return result;
        }, 'Session,Scan,Pass\n');
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `BrainSwipes-${this.dataset}-session-results.csv`);
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.excludedUsers, this.sliceThreshold, this.minSwipes];
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createChart(this.dataset, this.excludedUsers, this.sliceThreshold, this.minSwipes);
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>