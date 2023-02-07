<template>
  <div id="visualization">
    <h1> Study Visualizations </h1>
    <b-container>
      <div>
        <b-dropdown variant="warning" class="datasetsDropdown" :text="submittedDataset ? submittedDataset : 'Select Study'" ref="datasetDropdown">
          <b-dropdown-form>
            <b-form-radio-group
              id="radio-datasets"
              v-model="selectedDataset"
              :options="availableDatasets"
              name="chooseDataset"
              stacked
            ></b-form-radio-group>
          </b-dropdown-form>
        </b-dropdown>
      </div>
      <div> 
        <b-dropdown variant="warning" class="usersDropdown" text="Users to Include" ref="usersDropdown">
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
        <b-form-input id="range-minSwipes" v-model="minSwipes" type="range" min="1" :max="maxSwipes" :number="true"></b-form-input>
        <div class="mt-2">Include samples with a minimum of <span class="data-value">{{ minSwipes }}</span> swipes</div>
      </div>
      <div>
        <b-form-input id="range-threshold" v-model="threshold" type="range" min="0" max="100" step="5" :number="true"></b-form-input>
        <div class="mt-2">Samples with a minimum pass percentage of <span class="data-value">{{threshold}}%</span> will be considered a pass</div>
      </div>
      <div class="submit-div"><b-button variant="danger" :disabled="submitDisabled" v-on:click="updateCharts">Submit</b-button></div>
      <div id="charts" v-if="showCharts">
        <b-card no-body fill>
          <b-tabs card lazy>
            <b-tab title="Track Progress" active>
              <NumberOfVotes
              :dataset="submittedDataset"
              :db="db"
              />
              <hr>
              <RecentSwipes
              :dataset="submittedDataset"
              :db="db"
              />
              <!-- calculate needed swipes -->
            </b-tab>
            <b-tab title="Evaluate Users">
              <UserCorrectness
              :dataset="submittedDataset"
              :threshold="submittedThreshold"
              :minVotes="submittedMinSwipes"
              :db="db"
              :gradientArray="gradientArray"
              />
              <CatchTrialsByUser
              :dataset="submittedDataset"
              :threshold="submittedThreshold"
              :minVotes="submittedMinSwipes"
              :db="db"
              :gradientArray="gradientArray"
              />
              <NumberOfSwipesByUser
              :dataset="submittedDataset"
              :threshold="submittedThreshold"
              :db="db"
              :gradientArray="gradientArray"
              />
              <!-- <InterraterConcordance
              :dataset="dataset"
              :db="db"
              :gradientArray="gradientArray"
              /> -->
            </b-tab>              
            <b-tab title="Evaluate Samples">
              <SurvivingSessions
              :dataset="submittedDataset"
              :minSwipes="submittedMinSwipes"
              :excludedUsers="excludedUsers"
              :db="db"
              />
            </b-tab>
            <b-tab title="See Results">
              <SessionsPassFail
              :dataset="submittedDataset"
              :threshold="submittedThreshold"
              :minSwipes="submittedMinSwipes"
              :excludedUsers="excludedUsers"
              :db="db"
              />
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </b-container>

  </div>

</template>

<style>
  #visualization {
    padding-bottom: 12vh;
  }
  .usersDropdown .dropdown-menu {
    max-height: 300px;
    overflow-y: scroll;
  }
  .submit-div {
    margin-top: 3px;
  }
  #range-minSwipes, #range-threshold {
    max-width: 300px;
  }
  .datasetsDropdown{
    margin-bottom: 0.5em;
  }
  .data-value{
    font-weight: bold;
    font-size: 1.2em;
  }
</style>

<script>
  import Vue from 'vue';
  import colorGradient from 'javascript-color-gradient';
  import _ from 'lodash';
  import InterraterConcordance from './Visualizations/InterraterConcordance';
  import NumberOfSwipesByUser from './Visualizations/NumberOfSwipesByUser';
  import CatchTrialsByUser from './Visualizations/CatchTrialsbyUser';
  import SurvivngSessions from './Visualizations/SurvivingSessions';
  import SessionsPassFail from './Visualizations/SessionsPassFail';
  import UserCorrectness from './Visualizations/UserCorrectness';
  import NumberOfVotes from './Visualizations/NumberOfVotes';
  import RecentSwipes from './Visualizations/RecentSwipes';


  Vue.component('InterraterConcordance', InterraterConcordance);
  Vue.component('NumberOfSwipesByUser', NumberOfSwipesByUser);
  Vue.component('CatchTrialsByUser', CatchTrialsByUser);
  Vue.component('SurvivingSessions', SurvivngSessions);
  Vue.component('SessionsPassFail', SessionsPassFail);
  Vue.component('UserCorrectness', UserCorrectness);
  Vue.component('NumberOfVotes', NumberOfVotes);
  Vue.component('RecentSwipes', RecentSwipes);

  /**
   * Visualizations of study information.
   */
  export default {
    name: 'visualization',
    data() {
      return {
        selectedUsers: [],
        excludedUsers: [],
        survivingSessionsSeries: [],
        /**
         * tracks whether each chart is loading
         */
        survivingSessionsloading: true,
        userCorrectnessLoading: true,
        /**
         * default values for min/max swipes for a sample to show in charts
         */
        minSwipes: 1,
        maxSwipes: 5,
        /**
         * the dataset selected to view
         */
        selectedDataset: '',
        /**
         * prevents charts from showing until a study is selected
         */
        showCharts: false,
        /**
         * data for the UserCorrectness chart
         */
        userCorrectnessData: {},
        /**
         * default value selected as the threshold for a sample to pass
         */
        threshold: 100,
        /**
         * submit button lockout
         */
        submitDisabled: false,
        /**
         * versions of variables from the selectors that are only set after submit
         * this seperates chart loading and selecting options
         */
        submittedMinSwipes: 1,
        submittedDataset: '',
        submittedThreshold: '',
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
       * it comes directly from the `/users` document in Firebase.
       */
      allUsers: {
        type: Object,
        required: true,
      },
      /**
       * a list of the datasets that the logged in user is allowed to see
       */
      datasetPrivileges: {
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
          user => user !== '.key',
        );
        const usernameArray = [];
        // eslint-disable-next-line
        allUsernames.map((user) => {
          if (this.allUsers[user].score > 0) {
            usernameArray.push(user);
          }
        });
        this.selectedUsers = usernameArray;
        return usernameArray.sort();
      },
      availableDatasets() {
        return Object.keys(this.datasetPrivileges).filter(key => this.datasetPrivileges[key]);
      },
    },
    methods: {
      updateCharts() {
        this.submitDisabled = true;
        this.submittedMinSwipes = this.minSwipes;
        this.submittedDataset = this.selectedDataset;
        this.submittedThreshold = this.threshold / 100;
        this.excludedUsers = _.difference(this.sortedUsersList, this.selectedUsers);
        this.showCharts = true;
        this.submitDisabled = false;
      },
      selectAll() {
        this.selectedUsers = this.selectedUsers.length === this.sortedUsersList.length ?
          [] : _.clone(this.sortedUsersList);
      },
    },
  };
</script>
