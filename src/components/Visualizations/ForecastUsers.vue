<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="forecastUsers">
      <div class="chart-wrapper">
        <apexchart type="line" height="500" :options="chartOptions" :series="series"></apexchart>
      </div>
    </div>
  </div>
</template>
<style scoped>

</style>
<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'forecastUsers',
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
       * the dataset to visualize
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
      /**
       * Number of desired swipes per image
       */
      wantedSwipes: {
        type: Number,
        required: true,
      },
    },
    methods: {
      async createChart(dataset) {
        // get data from db
        const sampleCountsRef = this.db.ref(`datasets/${dataset}/sampleCounts`);
        const sampleCountsSnap = await sampleCountsRef.once('value');
        const sampleCounts = sampleCountsSnap.val();

        // calculate needed swipes
        const numSamples = Object.keys(sampleCounts).length;
        const neededSwipes = [];
        const numUsers = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];
        for (let i = 0; i < numUsers.length; i += 1) {
          neededSwipes.push(Math.round((numSamples * this.wantedSwipes) / numUsers[i]));
        }

        // data for apexcharts
        const options = {
          chart: {
            type: 'line',
            height: 350,
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Forecasted Number of Swipes Needed per User',
          },
          stroke: {
            show: true,
            width: 5,
            curve: 'straight',
          },
          xaxis: {
            categories: numUsers,
          },
          fill: {
            opacity: 1,
          },
          colors: ['#00C400', '#C40000'],
        };
        const series = [
          {
            name: 'Swipes Needed Per User',
            data: neededSwipes,
          },
        ];

        this.chartOptions = options;
        this.series = series;

        this.loading = false;
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.wantedSwipes];
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
