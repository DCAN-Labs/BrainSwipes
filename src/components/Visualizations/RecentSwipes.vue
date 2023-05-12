<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="recentSwipes">
      <div id="datePicker">
        <b-form-datepicker v-model="startDate" :min="earliestDate" :max="today" :value-as-date="true"></b-form-datepicker>
        <b-form-datepicker v-model="endDate" :min="earliestDate" :max="today" :value-as-date="true"></b-form-datepicker>
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
        /**
         * data from the db
         */
        votesByDay: {},
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
        // console.time('recentSwipes');
        // console.log('recentSwipes start');
        this.loading = true;
        // get data from db
        const votesRef = this.db.ref(`datasets/${dataset}/votes`);
        const votesSnap = await votesRef.once('value');
        const votes = votesSnap.val();
        // parse data
        const dateRangeObject = this.makeDateRangeObject();
        const reducedVotes = _.reduce(votes, function(result, value, key){
          if( value.hasOwnProperty('datetime')) {
            const date = new Date(value.datetime);
            const day = date.toLocaleDateString();
            if (dateRangeObject.hasOwnProperty(day)){
              (result[day] || (result[day] = [])).push(value.user);
            }
          }
          return result;
        }, dateRangeObject);
        this.votesByDay = reducedVotes;

        const votesPerDay = _.reduce(reducedVotes, function(result, value, key){
          result[key] = value.length
          return result;
        },{});
        const votesPerDayKeys = Object.keys(votesPerDay);
        const votesPerDayValues = Object.values(votesPerDay);

        // set colors
        const colorsArray = colorGradient
          .setGradient('#FF0000', '#FFFF00', '#00FF00', '#0000FF')
          .setMidpoint(votesPerDayKeys.length)
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
          legend: {
            show: false
          },
          colors: colorsArray,
          title: {
            text: 'Number of Swipes per Day',
          },
          subtitle: {
            text: '(Click on bar to see user specific data)',
            offsetX: 15
          },
          xaxis: {
            categories: votesPerDayKeys,
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
          data: votesPerDayValues,
        }];

        this.parentChartOptions = options;
        this.parentChartSeries = series;

        this.loading = false;
        // console.timeEnd('recentSwipes');
        /* eslint-enable */
      },
      createChildChart(dataPoint, color) {
        /* eslint-disable */
        const votesPerUser = _.reduce(this.votesByDay[dataPoint], function(result, value, key){
          result[value] = result[value] ? result[value] + 1 : 1;
          return result;
        }, {});
        /* eslint-enable */
        const dataKeys = Object.keys(votesPerUser);
        const dataValues = Object.values(votesPerUser);
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
            enabled: true,
          },
          colors: color,
          title: {
            // eslint-disable-next-line
            text: `Number of sample swiped on ${dataPoint} by user`,
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
            name: 'Number of swipes',
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
      makeDateRangeObject() {
        const dateRangeObject = {};
        const date = new Date(this.startDate);
        while (date <= this.endDate) {
          const key = date.toLocaleDateString();
          dateRangeObject[key] = [];
          date.setDate(date.getDate() + 1);
        }
        return dateRangeObject;
      },
    },
    computed: {
      propsToWatch() {
        return [this.dataset, this.startDate, this.endDate];
      },
      today() {
        return new Date();
      },
      earliestDate() {
        // July 8 2022 was the first day datetime was tracked on votes
        const earliestDate = new Date(1657311267608);
        earliestDate.setHours(0, 0, 0, 0);
        return earliestDate;
      },
    },
    watch: {
      propsToWatch: {
        handler() {
          this.createParentChart(this.dataset);
        },
        // immediate: true,
        deep: true,
      },
    },
    mounted() {
      this.initDates();
    },
  };
</script>