<template>
  <div v-if="loading">
    LOADING
  </div>
  <div v-else id="survivingSessions">
    <apexchart type="line" height="350" :options="chartOptions" :series="series"></apexchart>
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
    name: 'survivingSessions',
    data() {
      return {
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
        series: [],
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
        const ref = this.db.ref('datasets/BCP/visualizations/survivingSessions');
        const snap = await ref.once('value');
        const T1 = [];
        const T2 = [];
        const rest = [];
        const all = [];
        for (let i = 0; i < 100; i += 5) {
          T1.push([i, snap.val()[i].T1]);
          T2.push([i, snap.val()[i].T2]);
          rest.push([i, snap.val()[i].rest]);
          all.push([i, snap.val()[i].all]);
        }
        this.series = [{
          name: 'T1',
          data: T1,
        }, {
          name: 'T2',
          data: T2,
        }, {
          name: 'Rest',
          data: rest,
        }, {
          name: 'All',
          data: all,
        }];
        this.loading = false;
      },
    },
    created() {
      this.getData();
    },
  };
</script>