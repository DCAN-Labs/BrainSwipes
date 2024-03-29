<template>
  <div>
    <div v-if="!loading">
      <p>Users are considered correct if:</p>
      <p>They voted <span class="pass">PASS</span> on a slice with <span class="data-value">{{threshold.toFixed(2)}}</span> percent or higher average rating.</p>
      <p>They voted <span class="fail">FAIL</span> on a slice with <span class="data-value">{{(1 - threshold).toFixed(2)}}</span> percent or lower average rating.</p>
      <p>Slices outside of this range are excluded from this calculation.</p>
      <p>Slices with less than <span class="data-value">{{minVotes}}</span> votes are excluded from this calculation.</p>
    </div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="userCorrectness">
      <div class="chart-wrapper">
        <apexchart type="scatter" height="500" :options="chartOptions" :series="series"></apexchart>
      </div>
      <Legend
        :max="maxSwipes"
        :min="0"
        :gradientArray="gradientArray"
        :label="' Samples Swiped'"
      />
    </div>
  </div>
</template>

<style scoped>
strong{
  font-weight: bolder !important;
}
#userCorrectness{
  display: flex;
  justify-content: center;
}
.chart-wrapper{
  display: block;
  overflow: hidden;
  width: 100%;
}
.data-value{
  font-weight: bold;
  font-size: 1.2em;
}
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
  import Legend from './Legend/Legend';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);
  Vue.component('Legend', Legend);

  export default {
    name: 'userCorrectness',
    data() {
      return {
        /**
         * elements for building the chart
         */
        chartOptions: {
          chart: {
            height: 500,
            type: 'scatter',
            toolbar: {
              show: false,
            },
            zoom: {
              enabled: false,
              type: 'xy',
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Correct Decision Rate for Slices by User Relative to Other Users',
          },
          xaxis: {
            type: 'category',
            categories: [],
            labels: {},
          },
          markers: {},
          legend: {
            show: false,
          },
        },
        series: [{
          name: 'init',
          data: [],
        }],
        /**
         * Not apexCharts stuff
         */
        loading: true,
        sizes: [],
        maxSwipes: NaN,
        swipes: [],
      };
    },
    props: {
      /**
       * the dataset to swipe on
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * ratio of pass/fail swipes to consider the sample passed
       */
      threshold: {
        type: Number,
        required: true,
      },
      /**
       * minimum number of votes on a sample to be included in the chart
       */
      minVotes: {
        type: Number,
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
       * Color palette
       */
      gradientArray: {
        type: Array,
        required: true,
      },
    },
    computed: {
      categories() {
        const categories = [];
        this.gradientArray.forEach((color, index) => {
          const cutoff = (this.maxSwipes / this.gradientArray.length) * index;
          categories.push([cutoff, color, (index + 1) * 1.5]);
        });
        return categories;
      },
      propsToWatch() {
        return [this.dataset, this.threshold, this.minVotes];
      },
    },
    methods: {
      async getUserCorrectness(dataset, threshold, minVotes) {
        const sampleSummaryRef = this.db.ref(`datasets/${dataset}/sampleSummary`);
        const votesRef = this.db.ref(`datasets/${dataset}/votes`);
        const sampleSnap = await sampleSummaryRef.once('value');
        const votesSnap = await votesRef.once('value');
        const samples = sampleSnap.val();
        const votes = votesSnap.val();
        const votesByUser = _.reduce(votes, (result, value) => {
          const user = value.user;
          const sample = value.sample;
          const response = value.response;
          // eslint-disable-next-line
          result[user] ? result[user][sample] = response : result[user] = { [sample]: response };
          return result;
        }, {});
        const votesOverThreshold = _.reduce(votesByUser, (result, value, key) => {
          const correctVotes = _.reduce(value, (VOTresult, VOTvalue, VOTkey) => {
            const sampleSummaryAveVote = samples[VOTkey].aveVote;
            const sampleSummaryCount = samples[VOTkey].count;
            if (sampleSummaryCount >= minVotes &&
            (sampleSummaryAveVote >= threshold || sampleSummaryAveVote <= 1 - threshold)) {
              let correct;
              if (sampleSummaryAveVote >= threshold) {
                if (VOTvalue) {
                  correct = 1;
                } else {
                  correct = 0;
                }
              } else if (sampleSummaryAveVote <= 1 - threshold) {
                if (!VOTvalue) {
                  correct = 1;
                } else {
                  correct = 0;
                }
              }
              VOTresult.push(correct);
            }
            return VOTresult;
          }, []);
          result[key] = correctVotes;
          return result;
        }, {});
        const userTotals = _.reduce(votesOverThreshold, (result, value, key) => {
          const userTotal = _.reduce(value, (UTresult, UTvalue) => {
            UTresult += UTvalue;
            return UTresult;
          }, 0);
          // eslint-disable-next-line
          value.length ? result[key] = [userTotal, value.length] : null;
          return result;
        }, {});
        return userTotals;
      },
      async createChart(dataset, threshold, minVotes) {
        this.loading = true;
        const input = await this.getUserCorrectness(dataset, threshold, minVotes);
        const sortable = [];
        const swipes = [];
        Object.keys(input).forEach((user) => {
          sortable.push(
            [user, input[user][0], input[user][1], (input[user][0] / input[user][1]).toFixed(2)],
          );
          swipes.push(input[user][1]);
        });
        this.maxSwipes = Math.max(...swipes);
        // sorting the users in order of correctness
        sortable.sort((a, b) => b[3] - a[3]);
        const data = [];
        const names = [];
        const sortedSwipes = [];
        const markers = [];
        sortable.forEach((user, index) => {
          names.push(user[0]);
          sortedSwipes.push(user[2]);
          data.push(user[3]);
          markers.push(this.formatMarkers(user[2], index));
        });
        // setting the chart options
        this.series = [{ name: 'Correctness Ratio', data }];
        this.chartOptions.xaxis = { type: 'category', categories: names, labels: { rotate: -60, rotateAlways: true } };
        this.chartOptions.markers = { hover: { size: 20 }, discrete: markers };
        this.swipes = sortedSwipes;
        // setting the tooltip
        this.chartOptions.tooltip = {
          y: {
            formatter() {
              return '';
            },
            title: {
              formatter(seriesName, value) {
                return `<p>${seriesName}: <strong>${value.series[0][value.dataPointIndex]}</strong></p><p>Samples Swiped: <strong>${sortedSwipes[value.dataPointIndex]}</strong></p>`;
              },
            },
          },
        };
        // console.timeEnd('userCorrectness');
        this.loading = false;
      },
      formatMarkers(numRatings, index) {
        const category = this.getCategory(numRatings);
        return {
          seriesIndex: 0,
          dataPointIndex: index,
          fillColor: category[1],
          strokeColor: category[1],
          size: category[2],
          shape: 'circle',
        };
      },
      getCategory(n) {
        let chosenCategory = 0;
        this.categories.every((category, index) => {
          const test = n > category[0] + 1;
          chosenCategory = index;
          return test;
        });
        return this.categories[chosenCategory];
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createChart(this.dataset, this.threshold, this.minVotes);
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>