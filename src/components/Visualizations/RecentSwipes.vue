<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="recentSwipes">
      <div id="datePicker">
        <b-form-datepicker v-model="startDate" :min="earliestDate" :max="today" locale="en"></b-form-datepicker>
        <b-form-datepicker v-model="endDate" :min="earliestDate" :max="today" locale="en"></b-form-datepicker>
      </div>
      <div id="recentSwipesCharts">
        <div id="parentChart" :class="{ split: showChild }">
          <apexchart type="bar" height="350" :options="parentChartOptions" :series="parentChartSeries"></apexchart>
        </div>
        <div id="childChart" :class="{ childActive: showChild }">
          <apexchart type="bar" height="350" :options="childChartOptions" :series="childChartSeries"></apexchart>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  .split{
    width: 50% !important;
  }
  .childActive{
    display: block !important;
    width: 50%;
  }
  #childChart{
    display: none;
  }
  #parentChart{
    width: 100%
  }
  #recentSwipesCharts{
    display: flex;
  }
  #datePicker{
    display: flex;
  }
</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';
  import colorGradient from 'javascript-color-gradient';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'recentSwipes',
    data() {
      return {
        /**
         * whether the chart is loading
         */
        loading: true,
        /**
         * elements for building the parent chart
         */
        parentChartOptions: {},
        parentChartSeries: {},
        /**
         * elements for building the child chart
         */
        childChartOptions: {},
        childChartSeries: [],
        showChild: 0,
        selectedCategory: '',
        /**
         * setting date parameter
         */
        startDate: '',
        endDate: '',
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
      async createParentChart(dataset) {
        /* eslint-disable */
        console.time('recentSwipes');
        console.log('recentSwipes start');
        this.loading = true;
        // RegEx
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const restRegEx = RegExp('rest');
        // get data from db
        const sampleCountsRef = this.db.ref(`datasets/${dataset}/sampleCounts`);
        const sampleCountsSnap = await sampleCountsRef.once('value');
        const sampleCounts = sampleCountsSnap.val();
        // parse data
        const reducedSampleCounts = _.reduce(sampleCounts, function(result, value, key){
          result[value] ? result[value] = result[value] + 1 : result[value] = 1;
          return result;
        },{});
        const sampleKeys = Object.keys(reducedSampleCounts);
        const sampleValues = Object.values(reducedSampleCounts);


        const reducedSampleCountsByModality = _.reduce(sampleCounts, function(result, value, key){
          let modality = ''; // do we want atlas registrations seperate?
          if (key.match(restRegEx)) {
            modality = 'Rest'; // should this be 'Task'?
          } else if (key.match(t1RegEx)) {
            modality = 'T1';
          } else if (key.match(t2RegEx)) {
            modality = 'T2';
          } else {
            modality = 'Other';
          }
          result[value] ? result[value][modality] ? result[value][modality] += 1 : result[value][modality] = 1 : result[value] = {[modality]: 1 };
          return result;
        },{});
        this.samplesByModality = reducedSampleCountsByModality;

        // set colors
        const colorsArray = colorGradient
          .setGradient('#FF0000', '#FFFF00', '#00FF00', '#0000FF')
          .setMidpoint(sampleValues.length)
          .getArray();

        // create the chart
        const options = {
          chart: {
            height: 350,
            type: 'bar',
            toolbar: {
              show: false,
            },
            events: {
              dataPointSelection: (event, chartContext, config) => {
                const selectedCategory = config.w.config.xaxis.categories[config.dataPointIndex];
                const color = config.w.config.colors[config.dataPointIndex];
                this.handleClick(selectedCategory, color);
              },
              legendClick: (event, seriesIndex, config) => {
                const selectedCategory = config.config.xaxis.categories[seriesIndex];
                const color = config.config.colors[seriesIndex]
                this.handleClick(selectedCategory, color);
              },
            },
          },
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: false,
              distributed: true,
            }
          },
          dataLabels: {
            enabled: true
          },
          colors: colorsArray,
          title: {
            text: 'Number of Samples Voted on vs Day',
          },
          subtitle: {
            text: '(Click on bar to see details)',
            offsetX: 15
          },
          xaxis: {
            categories: sampleKeys,
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

        const series = [{
          name: 'Number of votes',
          data: sampleValues,
        }];
        console.log(typeof series);

        this.parentChartOptions = options;
        this.parentChartSeries = series;

        this.loading = false;
        console.timeEnd('recentSwipes');
        /* eslint-enable */
      },
      createChildChart(dataPoint, color) {
        const dataKeys = Object.keys(this.samplesByModality[dataPoint]);
        const dataValues = Object.values(this.samplesByModality[dataPoint]);
        const options = {
          chart: {
            type: 'bar',
            height: 350,
            toolbar: {
              show: false,
            },
          },
          plotOptions: {
            bar: {
              horizontal: true,
              borderRadius: 4,
            },
          },
          dataLabels: {
            enabled: false,
          },
          colors: color,
          title: {
            // eslint-disable-next-line
            text: `Number of images with ${dataPoint} vote${dataPoint == 1 ? '' : 's'} by image type`,
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
          },
          xaxis: {
            categories: dataKeys,
          },
          fill: {
            opacity: 1,
          },
        };
        const series = [
          {
            name: 'Number of samples',
            data: dataValues,
          },
        ];
        this.childChartOptions = options;
        this.childChartSeries = series;
      },
      handleClick(selectedCategory, color) {
        this.showChild = selectedCategory !== this.selectedCategory;
        // eslint-disable-next-line
        this.showChild ? this.selectedCategory = selectedCategory : this.selectedCategory = '';
        this.createChildChart(selectedCategory, color);
      },
      initDates() {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        this.startDate = startDate < this.earliestDate ? this.earliestDate : startDate;

        const endDate = new Date();
        this.endDate = endDate;
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset];
      },
      today() {
        return new Date();
      },
      earliestDate() {
        // July 8 2022 was the first day datetime was tracked on votes
        return new Date(1657311267608);
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createParentChart(this.dataset);
        },
        immediate: true,
        deep: true,
      },
    },
    mounted() {
      this.initDates();
    },
  };
</script>