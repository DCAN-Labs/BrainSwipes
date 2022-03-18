<template>
  <div id="summaries">
    <h1> Summary </h1>

    <b-container>
      <div> 
        <b-dropdown variant="warning" class="usersDropdown" text="Select Users to Exclude" ref="usersDropdown">
          <b-dropdown-form>
            <b-button v-on:click="selectAll">{{selectedUsers.length === sortedUsersList.length? 'Unselect All' : 'Select All'}}</b-button>
            <b-dropdown-divider></b-dropdown-divider>
            <b-form-checkbox-group
              id="checkbox-group-users"
              v-model="selectedUsers"
              :options="sortedUsersList"
              name="exclude-users"
              stacked
            ></b-form-checkbox-group>
          </b-dropdown-form>
        </b-dropdown>
      </div>
      <div>        
        <b-form-input id="range-minSwipes" v-model="minSwipes" type="range" min="1" :max="maxSwipes"></b-form-input>
        <div class="mt-2">Minimum number of swipes: {{ minSwipes }}</div>
      </div>
      <div class="submit-div"><b-button variant="danger" :disabled="survivingSessionsloading" v-on:click="updateExcludedUsers">Submit</b-button></div>
      <!-- <InterraterConcordance
      :dataset="dataset"
      :db="db"
      :gradientArray="gradientArray"
      /> -->
      <SurvivingSessions
      :series="survivingSessionsSeries"
      :loading="survivingSessionsloading"
      />
      <UserCorrectness
      :dataset="dataset"
      :db="db"
      :gradientArray="gradientArray"
      />
    </b-container>

  </div>

</template>

<style>
  #summaries {
    padding-bottom: 12vh;
  }
  .usersDropdown .dropdown-menu {
    max-height: 300px;
    overflow-y: scroll;
  }
  .submit-div {
    margin-top: 3px;
  }
  #range-minSwipes {
    max-width: 300px;
  }
</style>

<script>
  import Vue from 'vue';
  import colorGradient from 'javascript-color-gradient';
  import _ from 'lodash';
  import jsonQuery from 'json-query';
  import InterraterConcordance from './Visualizations/InterraterConcordance';
  import SurvivngSessions from './Visualizations/SurvivingSessions';
  import UserCorrectness from './Visualizations/UserCorrectness';


  Vue.component('InterraterConcordance', InterraterConcordance);
  Vue.component('SurvivingSessions', SurvivngSessions);
  Vue.component('UserCorrectness', UserCorrectness);

  /**
   * Visualizations of summary information.
   */
  export default {
    name: 'summaries',
    data() {
      return {
        selectedUsers: [],
        excludedUsers: [],
        survivingSessionsSeries: [],
        survivingSessionsloading: true,
        minSwipes: 1,
        maxSwipes: 1,
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
       * it comes directly from the `/uids` document in Firebase.
       */
      allUsers: {
        type: Object,
        required: true,
      },
    },
    computed: {
      gradientArray() {
        const gradientArray = colorGradient
          .setGradient('#440155', '#238a8d', '#fde725')
          .setMidpoint(20)
          .getArray();
        return gradientArray;
      },
      sortedUsersList() {
        /* Removes '.key' property present on allUsers data */
        const allUsernames = Object.keys(this.allUsers).filter(
          uid => uid !== '.key',
        );
        const usernameArray = [];
        // eslint-disable-next-line
        allUsernames.map((uid) => {
          if (this.allUsers[uid].score > 0) {
            usernameArray.push(this.allUsers[uid].username);
          }
        });
        this.selectedUsers = usernameArray;
        return usernameArray.sort();
      },
    },
    methods: {
      updateExcludedUsers() {
        this.excludedUsers = _.difference(this.sortedUsersList, this.selectedUsers);
        this.getData('BCP', this.excludedUsers, this.minSwipes);
      },
      selectAll() {
        this.selectedUsers = this.selectedUsers.length === this.sortedUsersList.length ?
          [] : _.clone(this.sortedUsersList);
      },
      async getData(dataset, excludedUsers, minSwipes) {
        /* eslint-disable */
        console.time('function');
        console.log('function start');
        this.survivingSessionsloading = true;
        // RegEx
        const sessionRegEx = RegExp('sub-[0-9]{6}_ses-[0-9]*mo');
        const t1RegEx = RegExp('T1');
        const t2RegEx = RegExp('T2');
        const restRegEx = RegExp('rest');
        // db
        const dbRef = this.db.ref(`datasets/${dataset}/votes`);
        const snap = await dbRef.once('value');
        console.timeLog('function');
        console.log('db snapshot created');
        // format excluded users for use in jsonQuery
        const userQuery = excludedUsers.map(user => `user!=${user}`).join(' && ');
        // query db snapshot
        const query = jsonQuery(`[**][* ${userQuery}]`, { data: snap.val() });
        // reduce query
        const reducedBySample = _.reduce(query.references[0], (result, value) => {
          const sample = value.sample;
          (result[sample] || (result[sample] = [])).push(value.response);
          return result;
        }, {});

        const removeLowSwipeCounts = _.reduce(reducedBySample, function(result, value, key){
            if (value.length >= minSwipes) {
                result[key] = value;
            }
            return result;
        }, {});

        this.maxSwipes = _.reduce(reducedBySample, function(result, value){
          return _.max([result, value.length]);
        }, 1);

        const averageScoreBySample = _.mapValues(removeLowSwipeCounts, o => _.mean(o));

        const reducedBySession = _.reduce(averageScoreBySample, (result, value, key) => {
          const ses = key.match(sessionRegEx)[0];
          let modality = '';
          if (key.match(restRegEx)) {
            modality = 'Rest';
          } else if (key.match(t1RegEx)) {
            modality = 'T1';
          } else if (key.match(t2RegEx)) {
            modality = 'T2';
          } else {
            modality = 'Other';
          }
          (result[ses] || (result[ses] = [])).push({ [modality]: value });
          return result;
        }, {});

        const minBySessionModality = _.reduce(reducedBySession, (result, modalities, session) => {
          const reducedSample = _.reduce(modalities, (minimum, value) => {
            minimum[Object.keys(value)] = _.min([(minimum[Object.keys(value)] || 9), Object.values(value)[0]]);
            return minimum;
          }, {});
          const sessionFloor = _.reduce(reducedSample, (innerResult, value) => _.min([innerResult, value]), 9);
          reducedSample.All = sessionFloor;
          result[session] = reducedSample;
          return result;
        }, {});

        const reducedCutoffs = _.reduce(minBySessionModality, (result, value) => {
          result.T1[value.T1] = result.T1[value.T1] ? result.T1[value.T1] + 1 : 1;
          result.T2[value.T2] = result.T2[value.T2] ? result.T2[value.T2] + 1 : 1;
          result.Rest[value.Rest] = result.Rest[value.Rest] ? result.Rest[value.Rest] + 1 : 1;
          result.All[value.All] = result.All[value.All] ? result.All[value.All] + 1 : 1;
          return result;
        }, { T1: {}, T2: {}, Rest: {}, All: {} });

        const numSamplesPerThreshold = _.reduce(reducedCutoffs, (outerResult, scores, modality) => {
          const modalityThresholds = _.reduce(scores, (result, value, key) => {
            for (let i = 0; i < 100; i += 5) {
              if (key >= i / 100) {
                result[i] += value;
              }
            }
            return result;
          }, { 0: 0, 5: 0, 10: 0, 15: 0, 20: 0, 25: 0, 30: 0, 35: 0, 40: 0, 45: 0, 50: 0,55: 0, 60: 0, 65: 0, 70: 0, 75: 0, 80: 0, 85: 0, 90: 0, 95: 0 });
          outerResult[modality] = modalityThresholds;
          return outerResult;
        }, { T1: {}, T2: {}, Rest: {}, All: {} });

        const thresholdsAsPairs = _.reduce(numSamplesPerThreshold, (result, value, key) => {
          result[key] = _.toPairs(value);
          return result;
        }, {});

        const thresholdsAsInt = _.reduce(thresholdsAsPairs, function(outerResult, outerValue, outerKey){
          const thresholdAsInt = _.reduce(outerValue, function(result, value){
              result.push(_.map(value, _.parseInt));
              return result;
          }, []);
          outerResult[outerKey] = thresholdAsInt;
          return outerResult;
        }, {});

        this.survivingSessionsSeries = [{
          name: 'T1',
          data: thresholdsAsInt.T1,
        }, {
          name: 'T2',
          data: thresholdsAsInt.T2,
        }, {
          name: 'Rest',
          data: thresholdsAsInt.Rest,
        }, {
          name: 'All',
          data: thresholdsAsInt.All,
        }];
        this.survivingSessionsloading = false;
        console.timeEnd('function');
        /* eslint-enable */
      },
    },
    created() {
      this.getData('BCP', this.excludedUsers, this.minSwipes);
    },
  };
</script>
