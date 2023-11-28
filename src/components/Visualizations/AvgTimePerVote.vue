<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="avgTimePerVote">
      <div id="avgTimePerVoteChart">
        <apexchart type="scatter" height="350" :options="avgTimePerVoteOptions" :series="avgTimePerVoteSeries"></apexchart>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'avgTimePerVote',
    data() {
      return {
        /**
         * whether the chart is loading
         */
        loading: true,
        /**
         * elements for building the chart
         */
        avgTimePerVoteOptions: {},
        avgTimePerVoteSeries: {},
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
    },
    methods: {
      async createChart(dataset) {
        this.loading = true;
        // get data from db
        const votesRef = this.db.ref(`datasets/${dataset}/votes`);
        const votesSnap = await votesRef.once('value');
        const votes = votesSnap.val();

        // identify outliers
        const times = _.reduce(votes, (result, value) => {
          result.push(value.time);
          return result;
        }, []);
        const [maxValue, minValue] = this.filterOutliers(times);

        // parse data
        const reducedVotes = _.reduce(votes, (result, value) => {
          if (Object.hasOwn(value, 'time')) {
            if (maxValue >= value.time && value.time >= minValue) {
              (result[value.user] || (result[value.user] = [])).push(value.time);
            }
          }
          return result;
        }, {});

        const avgVoteTimePerUser = _.reduce(reducedVotes, (result, value, key) => {
          const data = [value.length, Math.round(_.mean(value))];
          result.push({ name: key, data: [data] });
          return result;
        }, []);

        // create the chart
        const options = {
          chart: {
            height: 350,
            type: 'scatter',
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          xaxis: {
            tickAmount: 10,
          },
          legend: {
            show: false,
          },
          title: {
            text: 'Average Time per Vote (milliseconds) vs Total Votes',
          },
          tooltip: {
            y: {
              formatter(seriesName) {
                return `${seriesName}`;
              },
              title: {
                formatter() {
                  return '<p>Average milliseconds per vote</p>';
                },
              },
            },
            x: {
              formatter(seriesName, value) {
                return `<p>${avgVoteTimePerUser[value.seriesIndex].name}</p><p>${seriesName} votes</p>`;
              },
            },
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

        this.avgTimePerVoteOptions = options;
        this.avgTimePerVoteSeries = avgVoteTimePerUser;

        this.loading = false;
      },
      filterOutliers(someArray) {
        // https://stackoverflow.com/a/20811670
        // Copy the values, rather than operating on references to existing values
        const values = someArray.concat();

        // Then sort
        values.sort((a, b) => a - b);

        /* Then find a generous IQR. This is generous because if (values.length / 4)
        * is not an int, then really you should average the two elements on either
        * side to find q1.
        */
        const q1 = values[Math.floor((values.length / 4))];
        // Likewise for q3.
        const q3 = values[Math.ceil((values.length * (3 / 4)))];
        const iqr = q3 - q1;

        // Then find min and max values
        const maxValue = q3 + (iqr * 1.5);
        const minValue = q1 - (iqr * 1.5);

        return [maxValue, minValue];
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset];
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createChart(this.dataset);
        },
        // immediate: true,
        deep: true,
      },
    },
    mounted() {
      this.createChart(this.dataset);
    },
  };
</script>