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

        // parse data
        const reducedVotes = _.reduce(votes, (result, value) => {
          if (Object.hasOwn(value, 'time')) {
            (result[value.user] || (result[value.user] = [])).push(value.time);
          }
          return result;
        }, {});

        const avgVoteTimePerUser = _.reduce(reducedVotes, (result, value, key) => {
          const data = [value.length, Math.round(this.median(value))];
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
            text: 'Median Time per Vote (milliseconds) vs Total Votes',
          },
          tooltip: {
            y: {
              formatter(seriesName) {
                return `${seriesName}`;
              },
              title: {
                formatter() {
                  return '<p>Median milliseconds per vote</p>';
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
      median(values) {
        // https://stackoverflow.com/a/45309555
        if (values.length === 0) {
          throw new Error('Input array is empty');
        }

        // Sorting values, preventing original array
        // from being mutated.
        values = [...values].sort((a, b) => a - b);

        const half = Math.floor(values.length / 2);

        return (values.length % 2
          ? values[half]
          : (values[half - 1] + values[half]) / 2
        );
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