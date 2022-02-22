<template>
  <div id="InterraterConcordance">
    <apexchart type="line" height="200" :options="chartOptions" :series="series"></apexchart>
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
            type: 'line',
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          colors: ['#008FFB'],
          title: {
            text: 'Number of Surviving Sessions at Different Rating Cutoffs',
          },
        },
        series: [{
          name: 'Sample Data',
          data: [10, 41, 35, 51, 49, 62, 69, 91, 148],
        }],
        xaxis: {
          categories: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
        /**
         * number of samples with each threshold
         */
        sampleSummaries: {},
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
    mounted() {
    //   this.getSampleSummaries('BCP');
    },
    methods: {
      getSampleSummaries(dataset) {
        this.db.ref(`/datasets/${dataset}/sampleSummary`).once('value').then((snap) => {
          Object.keys(snap.val()).forEach((key) => {
              const score = snap.val()[key].aveCount;
              if (this.sampleSummaries[score]) {
                this.sampleSummaries[score] = this.sampleSummaries[score] + 1;
              } else {
                this.sampleSummaries[score] = 1;
              }
          });
          console.log(this.sampleSummaries);
        });
      },
    },
  };
</script>