<template>
  <div>
    <div v-if="loading">
      LOADING
    </div>
    <div v-else id="neededUserSwipes">
      <div class="chart-wrapper">
        <apexchart type="bar" height="500" :options="chartOptions" :series="series"></apexchart>
      </div>
    </div>
  </div>
</template>
<style scoped>

</style>
<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';
  import _ from 'lodash';
  import firebase from 'firebase/app';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'neededUserSwipes',
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
       * the study the selected dataset is from
       */
      study: {
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
       * config document from firebase
       */
      config: {
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
      /**
       * list of users to exclude from the chart data
       */
      excludedUsers: {
        type: Array,
        required: true,
      },
    },
    methods: {
      async createChart(dataset) {
        // get data from db
        const votesRef = this.db.ref(`datasets/${dataset}/votes`);
        const votesSnap = await votesRef.once('value');
        const votes = votesSnap.val();
        const sampleCountsRef = this.db.ref(`datasets/${dataset}/sampleCounts`);
        const sampleCountsSnap = await sampleCountsRef.once('value');
        const sampleCounts = sampleCountsSnap.val();
        const restrictedStudy = !this.config.studies[this.study].available;
        let reducedVotes = {};
        // get users and their total swipes
        if (restrictedStudy) {
          const userObject = await this.getStudyUsers();
          reducedVotes = _.reduce(votes, (result, value) => {
            const user = value.user;
            if (Object.hasOwn(result, user)) {
              // eslint-disable-next-line
              result[user] += 1;
            }
            return result;
          }, userObject);
        } else {
          reducedVotes = _.reduce(votes, (result, value) => {
            const user = value.user;
            // eslint-disable-next-line
            result[user] ? result[user] += 1 : result[user] = 1;
            return result;
          }, {});
        }
        console.log(reducedVotes);
        // sort users by number of votes
        const sortable = [];
        Object.keys(reducedVotes).forEach((user) => {
          sortable.push([user, reducedVotes[user]]);
        });
        const sorted = sortable.sort((a, b) => b[1] - a[1]);
        const categories = [];
        const counts = [];
        const totalSamples = Object.keys(sampleCounts).length;
        const wantedSwipes = this.wantedSwipes * totalSamples;
        const wantedSwipesPerUser = Math.round(wantedSwipes / sorted.length);
        const neededSwipes = [];
        sorted.forEach((element) => {
          categories.push(element[0]);
          counts.push(element[1]);
          neededSwipes.push(wantedSwipesPerUser - element[1]);
        });

        // data for apexcharts
        const options = {
          chart: {
            type: 'bar',
            height: 350,
            toolbar: {
              show: false,
            },
            stacked: true,
          },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              endingShape: 'rounded',
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Number of Swipes Needed by User',
          },
          stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
          },
          xaxis: {
            categories,
          },
          fill: {
            opacity: 1,
          },
          colors: ['#00C400', '#C40000'],
        };
        const series = [
          {
            name: 'Swipes Completed',
            data: counts,
          },
          {
            name: 'Swipes Needed',
            data: neededSwipes,
          },
        ];

        this.chartOptions = options;
        this.series = series;

        this.loading = false;
      },
      /**
       * gets user roles from the server
       */
      requestAllUserRoles() {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/getAllUsers', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onload = resolve;
          xhr.onerror = reject;
          xhr.send(JSON.stringify({
            currentUser: firebase.auth().currentUser.uid,
          }));
        });
      },
      /**
       * returns a list of users registered for the current study
       */
      async getStudyUsers() {
        const authUserList = await this.requestAllUserRoles()
          .then(data => JSON.parse(data.currentTarget.responseText));
        const filteredUserList = Object.keys(_.pickBy(authUserList, value =>
          (value.datasets[this.study]),
        ));
        return _.zipObject(filteredUserList, Array(filteredUserList.length).fill(0));
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
