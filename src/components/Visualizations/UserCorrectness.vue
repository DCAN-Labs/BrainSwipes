<template>
  <div v-if="loading || parentLoading">
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
</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
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
            text: 'Correct Decision Rate for Passed Samples by User',
          },
          xaxis: {
            type: 'category',
            categories: [],
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
      /**
       * data for the chart
       */
      chartData: {
        type: Object,
        required: true,
      },
      /**
       * whether the data is loading
       */
      parentLoading: {
        type: Boolean,
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
    },
    methods: {
      async getData() {
      //   const ref = this.db.ref('datasets/BCP/visualizations/userCorrectness');
      //   const snap = await ref.once('value');
      //   const input = JSON.parse(JSON.stringify(snap.val()));
        const input = this.chartData;
        const sortable = [];
        const swipes = [];
        Object.keys(input).forEach((user) => {
          // eslint-disable-next-line
          sortable.push([user, input[user][0], input[user][1], (input[user][0] / input[user][1]).toFixed(2)]);
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
        this.chartOptions.xaxis = { type: 'category', categories: names };
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
    created() {
      this.getData();
    },
  };
</script>