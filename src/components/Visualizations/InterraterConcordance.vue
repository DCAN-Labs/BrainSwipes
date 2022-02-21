<template>
  <div id="InterraterConcordance">
    <h1> Interrater Concordance </h1>
    <apexchart width="500" type="bar" :options="chartOptions" :series="series"></apexchart>
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
      chartOptions: {
        chart: {
          id: 'vuechart-example',
        },
        xaxis: {
          categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998],
        },
      },
      series: [{
        name: 'series-1',
        data: [30, 40, 35, 50, 49, 60, 70, 91],
      }],
    };
  },
};
</script>