<template>
  <div v-if="loading">
    LOADING
  </div>
  <div v-else id="userCorrectness">
    <apexchart type="scatter" height="500" :options="chartOptions" :series="series"></apexchart>
  </div>

</template>

<style>

</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

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
            text: 'Correct Decision Rate for Passed Samples by User',
          },
          xaxis: {
            type: 'category',
            categories: [],
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
       * the intialized firebase database
       */
      db: {
        type: Object,
        required: true,
      },
    },
    methods: {
      async getData() {
        const ref = this.db.ref('datasets/BCP/visualizations/userCorrectness');
        const snap = await ref.once('value');
        const input = JSON.parse(JSON.stringify(snap.val()));
        const sortable = [];
        Object.keys(input).forEach((user) => {
          // eslint-disable-next-line
          sortable.push([user, input[user][0], input[user][1], (input[user][0] / input[user][1]).toFixed(2)]);
        });
        sortable.sort((a, b) => b[3] - a[3]);
        const data = [];
        const names = [];
        sortable.forEach((user) => {
          names.push(user[0]);
          data.push(user[3]);
        });
        this.series = [{ name: 'Correctness Ratio', data }];
        this.chartOptions.xaxis = { type: 'category', categories: names };
        this.loading = false;
      },
    },
    created() {
      this.getData();
    },
  };
</script>