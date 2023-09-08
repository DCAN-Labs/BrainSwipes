<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="numberOfSwipesByUser">
      <div class="chart-wrapper">
        <apexchart type="bar" height="500" :options="chartOptions" :series="series"></apexchart>
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
    name: 'numberOfSwipesByUser',
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
        series: {},
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
    methods: {
      async createChart(dataset) {
        // get data from db
        const votesRef = this.db.ref(`datasets/${dataset}/votes`);
        const votesSnap = await votesRef.once('value');
        const votes = votesSnap.val();
        // parse data
        const reducedVotes = _.reduce(votes, (result, value) => {
          const user = value.user;
          const response = value.response === 1 ? 'pass' : 'fail';
          const notResponse = value.response === 1 ? 'fail' : 'pass';
          // eslint-disable-next-line
          result[user] ? result[user][response] += 1 : result[user] = { user, [response]: 1, [notResponse]: 0 };
          return result;
        }, {});
        const sorted = _.sortBy(reducedVotes, [o => o.pass + o.fail]);
        let categories = [];
        let pass = [];
        let fail = [];
        sorted.forEach((user) => {
          categories.push(user.user);
          pass.push(user.pass);
          fail.push(user.fail);
        });
        categories = _.reverse(categories);
        pass = _.reverse(pass);
        fail = _.reverse(fail);

        const options = {
          chart: {
            type: 'bar',
            height: 350,
            toolbar: {
              show: false,
            },
            stacked: true,
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              endingShape: 'rounded',
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Number of Swipes by User',
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
          },
          xaxis: {
            categories,
          },
          fill: {
            opacity: 1,
          },
          colors: ['#00C400', '#C40000'],
        };
        const series = [
          {
            name: 'Number of Passes',
            data: pass,
          },
          {
            name: 'Number of Fails',
            data: fail,
          },
        ];

        this.chartOptions = options;
        this.series = series;

        this.loading = false;
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
        immediate: true,
        deep: true,
      },
    },
  };
</script>
