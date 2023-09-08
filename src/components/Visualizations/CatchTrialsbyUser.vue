<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="catchTrialsbyUser">
      <div id="parentChart" :class="{ split: showChild }">
        <apexchart type="scatter" height="350" :options="parentChartOptions" :series="parentChartSeries"></apexchart>
      </div>
      <div id="childChart" :class="{ childActive: showChild }">
        <apexchart type="bar" height="350" :options="childChartOptions" :series="childChartSeries"></apexchart>
      </div>
      <Legend
        :max="maxSwipes"
        :min="0"
        :gradientArray="gradientArray"
        :label="' Samples Swiped'"
      />
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
  #catchTrialsbyUser{
    display: flex;
  }
</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';
  import Legend from './Legend/Legend';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);
  Vue.component('Legend', Legend);

  export default {
    name: 'catchTrialsbyUser',
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
         * elements for getting the child chart's data
         */
        samplesByModality: {},
        maxSwipes: 15,
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
      /**
       * Color palette
       */
      gradientArray: {
        type: Array,
        required: true,
      },
    },
    methods: {
      async createParentChart(dataset) {
        /* eslint-disable no-param-reassign */
        this.loading = true;
        // get data from db
        const catchAnswersRef = this.db.ref(`datasets/${dataset}/catch/sampleCounts`);
        const catchAnswersSnap = await catchAnswersRef.once('value');
        const catchAnswers = catchAnswersSnap.val();

        const catchVotesRef = this.db.ref(`datasets/${dataset}/catch/votes`);
        const catchVotesSnap = await catchVotesRef.once('value');
        const catchVotes = catchVotesSnap.val();
        // parse data
        const voteCorrectness = _.reduce(catchVotes, (result, value) => {
          const correctAnswer = catchAnswers[value.sample] === 'pass' ? 1 : 0;
          const wasCorrect = value.response === correctAnswer;
          Object.hasOwn(result, value.user) ?
            result[value.user].push({ sample: value.sample, wasCorrect }) :
            result[value.user] = [{ sample: value.sample, wasCorrect }];
          return result;
        }, {});
        const swipes = [];
        const overallUserData = _.reduce(voteCorrectness, (result, value, key) => {
          const numberCorrect = _.reduce(value, (userResult, userValue) => {
            userResult = userValue.wasCorrect ? userResult + 1 : userResult;
            return userResult;
          }, 0);
          const totalTrials = value.length;
          result[key] = { numberCorrect, totalTrials };
          swipes.push(totalTrials);
          return result;
        }, {});

        this.maxSwipes = Math.max(...swipes);

        const overallUserRatio = _.reduce(overallUserData, (result, value, key) => {
          result[key] = (value.numberCorrect / value.totalTrials).toFixed(2);
          return result;
        }, {});

        const pairedUserRatios = _.toPairs(overallUserRatio);
        pairedUserRatios.sort((a, b) => b[1] - a[1]);
        const categories = [];
        const data = [];
        pairedUserRatios.forEach((userRatio) => {
          categories.push(userRatio[0]);
          data.push(userRatio[1]);
        });

        const markers = [];
        pairedUserRatios.forEach((user, index) => {
          markers.push(this.formatMarkers(overallUserData[user[0]].totalTrials, index));
        });

        // create the chart
        const options = {
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
            text: 'Correct Decision Rate for Catch Trials by User',
          },
          xaxis: {
            type: 'category',
            categories,
            labels: { rotate: -60, rotateAlways: true },
          },
          markers: { hover: { size: 20 }, discrete: markers },
          legend: {
            show: false,
          },
          tooltip: {
            y: {
              formatter() {
                return '';
              },
              title: {
                formatter(seriesName, value) {
                  return `<p>${seriesName}: <strong>${value.series[0][value.dataPointIndex]}</strong></p><p>Trials Swiped: <strong>${overallUserData[pairedUserRatios[value.dataPointIndex][0]].totalTrials}</strong></p>`;
                },
              },
            },
          },
        };
        const series = [{
          name: 'Correctness Ratio',
          data,
        }];

        this.parentChartOptions = options;
        this.parentChartSeries = series;

        this.loading = false;
        /* eslint-enable no-param-reassign */
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
            enabled: true,
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
      formatMarkers(numRatings, index) {
        const category = this.getCategory(numRatings);
        return {
          seriesIndex: 0,
          dataPointIndex: index,
          fillColor: category.color,
          strokeColor: category.color,
          size: category.size,
          shape: 'circle',
        };
      },
      getCategory(n) {
        let chosenCategory = 0;
        this.categories.every((category, index) => {
          const test = n > category.cutoff + 1;
          chosenCategory = index;
          return test;
        });
        return this.categories[chosenCategory];
      },
    },
    computed: {
      categories() {
        const categories = [];
        this.gradientArray.forEach((color, index) => {
          const cutoff = (this.maxSwipes / this.gradientArray.length) * index;
          categories.push({ cutoff, color, size: ((index + 1) * 1.5) });
        });
        return categories;
      },
      propsToWatch() {
        return [this.dataset];
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
  };
</script>