<template>
  <div v-if="loading">
    LOADING
  </div>
  <div v-else id="InterraterConcordance">
    <apexchart ref="heatmap" type="heatmap" height="650" :options="chartOptions" :series="chartData"></apexchart>
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
            animations: {
              enabled: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          colors: ['#000000'],
          title: {
            text: 'Inter-Rater Concordance (percent agreement)',
          },
          tooltip: {
            y: {
              formatter(value) {
                if (value === 200) {
                  return 'No Data';
                }
                return `${value}%`;
              },
            },
          },
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [{
                  from: 199,
                  to: 201,
                  color: '#FFFFFF',
                  name: ' ',
                }],
              },
            },
          },
          xaxis: {
            type: 'category',
            categories: [],
          },
        },
        /**
         * data from the db
         */
        chartData: [],
        loading: true,
        categories: [],
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
    },
    created() {
      this.setColors();
      this.getData(500);
    },
    methods: {
      async getData(min) {
        const ref = this.db.ref('datasets/BCP/visualizations/interRaterConcordance');
        const snap = await ref.once('value');
        Object.keys(snap.val()).forEach((user1) => {
          if (snap.val()[user1][user1][0] >= min) {
            this.categories.push(user1);
            const series = [];
            Object.keys(snap.val()[user1]).forEach((user2) => {
              if (snap.val()[user2][user2][0] >= min) {
                const scores = snap.val()[user1][user2];
                let ratio = scores[0] / scores[1];
                if (!ratio) {
                  ratio = 2;
                }
                series.push(100 * ratio.toFixed(2));
              }
            });
            this.chartData.push({
              name: [user1],
              data: series,
            });
          }
        });
        this.chartOptions.xaxis = { type: 'category', categories: this.categories };
        this.loading = false;
      },
      setColors() {
        const ranges = [];
        for (let i = 0; i < this.gradientArray.length; i += 1) {
          ranges.push({
            from: (100 / this.gradientArray.length) * i,
            to: (100 / this.gradientArray.length) * (i + 1),
            color: this.gradientArray[i],
          });
        }
        ranges.push({
          from: 199,
          to: 201,
          color: '#FFFFFF',
          name: 'No Data',
        });
        this.chartOptions.plotOptions.heatmap.colorScale.ranges = ranges;
      },
    },
  };
</script>