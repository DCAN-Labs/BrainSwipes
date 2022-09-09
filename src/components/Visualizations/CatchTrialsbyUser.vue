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
  import { labels } from '../../labels';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

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
        /* eslint-disable */
        console.time('catchTrialsByUser');
        console.log('catchTrialsByUser start');
        this.loading = true;
        // RegEx
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const restRegEx = RegExp('rest');
        // get data from db
        const catchAnswersRef = this.db.ref(`datasets/${dataset}/catch/sampleCounts`);
        const catchAnswersSnap = await catchAnswersRef.once('value');
        const catchAnswers = catchAnswersSnap.val();

        const catchVotesRef = this.db.ref(`datasets/${dataset}/catch/votes`);
        const catchVotesSnap = await catchVotesRef.once('value');
        const catchVotes = catchVotesSnap.val();
        // parse data
        const voteCorrectness = _.reduce(catchVotes, function(result, value){
          const correctAnswer = catchAnswers[value.sample] === 'pass' ? 1 : 0;
          const wasCorrect = value.response === correctAnswer;
          Object.hasOwnProperty.call(result, value.user) ? result[value.user].push({sample: value.sample, wasCorrect}) : result[value.user] = [{sample: value.sample, wasCorrect}];
          return result;
        },{});

        const overallUserData = _.reduce(voteCorrectness, (result, value, key) => {
          const numberCorrect = _.reduce(value, (userResult, userValue) => {
            userResult = userValue.wasCorrect ? userResult + 1 : userResult; 
            return userResult;
          },0);
          const totalTrials = value.length;
          result[key] = {numberCorrect, totalTrials};
          return result;
        },{});
        
        const overallUserRatio = _.reduce(overallUserData, (result, value, key) => {
          result[key] = value.numberCorrect / value.totalTrials;
          return result;
        },{});


        // TO DO: child chart sorting trial results based on image type
        // const reducedSampleCountsByModality = _.reduce(sampleCounts, function(result, value, key){
        //   let modality = '';
        //   if (key.match(restRegEx)) {
        //     modality = 'Rest'; // should this be 'Task'?
        //   } else if (key.match(t1RegEx)) {
        //     modality = 'T1';
        //   } else if (key.match(t2RegEx)) {
        //     modality = 'T2';
        //   } else {
        //     modality = 'Other';
        //   }
        //   result[value] ? result[value][modality] ? result[value][modality] += 1 : result[value][modality] = 1 : result[value] = {[modality]: 1 };
        //   return result;
        // },{});
        // this.samplesByModality = reducedSampleCountsByModality;
        const markers = [];
        Object.keys(overallUserData).forEach((user, index) => {
          markers.push(this.formatMarkers(overallUserData[user].totalTrials, index));
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
            categories: Object.keys(overallUserRatio),
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
                  return `<p>${seriesName}: <strong>${value.series[0][value.dataPointIndex]}</strong></p><p>Trials Swiped: <strong>${overallUserData[Object.keys(overallUserData)[value.dataPointIndex]].totalTrials}</strong></p>`;
                },
              },
            },
          },
        };
        const series = [{
          name: 'Correctness Ratio',
          data: Object.values(overallUserRatio),
        }];


        this.parentChartOptions = options;
        this.parentChartSeries = series;
        console.log(this.parentChartOptions);
        console.log(this.parentChartSeries);

        this.loading = false;
        console.timeEnd('catchTrialsByUser');
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
      labelsRegex() {
        return new RegExp(labels.join('|'));
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