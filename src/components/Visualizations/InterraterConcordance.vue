<template>
  <div id="InterraterConcordance">
    <apexchart type="heatmap" height="200" :options="chartOptions" :series="series"></apexchart>
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
    name: 'InterraterConcordance',
    data() {
      return {
        /**
         * elements for building the chart
         */
        chartOptions: {
          chart: {
            height: 350,
            type: 'heatmap',
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          colors: ['#008FFB'],
          title: {
            text: 'Inter-Rater Concordance',
          },
        },
        series: [{
          name: 'Metric1',
          data: [90, 70, 20, 90, 20, 90, 20, 20, 30, 40, 60, 10, 90, 0, 100, 14, 46, 23],
        },
        {
          name: 'Metric2',
          data: [70, 20, 90, 70, 20, 90, 20, 20, 40, 60, 10, 90, 0, 100, 14, 46, 23, 90],
        },
        {
          name: 'Metric3',
          data: [90, 70, 20, 90, 70, 20, 20, 20, 30, 40, 60, 10, 90, 0, 100, 14, 46, 23],
        },
        {
          name: 'Metric4',
          data: [90, 70, 20, 90, 70, 20, 90, 20, 20, 30, 40, 60, 10, 90, 0, 14, 46, 23],
        },
        {
          name: 'Metric5',
          data: [90, 70, 20, 90, 70, 20, 90, 20, 20, 40, 60, 10, 90, 0, 100, 14, 46, 23],
        },
        {
          name: 'Metric6',
          data: [90, 70, 20, 70, 20, 90, 20, 20, 30, 40, 60, 10, 90, 0, 100, 14, 46, 23],
        },
        ],
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
  };
</script>