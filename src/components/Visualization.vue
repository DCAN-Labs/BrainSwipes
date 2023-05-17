<template>
  <div id="visualization">
    <h1> Study Visualizations </h1>
    <b-container>
      <DatasetSelect
        :globusToken="globusToken"
        :getGlobusIdentities="getGlobusIdentities"
        :errorCodes="errorCodes"
        :config="config"
        :datasetPrivileges="datasetPrivileges"
        :surpressArchived="false"
        :showUnavailable="false"
        :useGlobus="true"
        @activateDataset="activateDataset"
        @activateStudy="activateStudy"
      />
      <div v-if="showControls" class="center-flex">
        <div class="control-wrapper">
          <div class="control-group"> 
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
            <p class="control-note">Include/exclude votes by specific users in 'Evaluate Sessions' and 'See Results'</p>
          </div>
          <div class="control-group">      
            <b-form-input id="range-minSwipes" v-model="minSwipes" type="range" min="1" :max="maxSwipes" :number="true"></b-form-input>
            <div class="mt-2">Include samples with a minimum of <span class="data-value">{{ minSwipes }}</span> swipes</div>
            <p class="control-note">Affects 'Evaluate Users', 'Evaluate Sessions', 'See Results'</p>
          </div>
          <div class="control-group">
            <b-form-input id="range-threshold" v-model="threshold" type="range" min="0" max="100" step="5" :number="true"></b-form-input>
            <div class="mt-2"><span class="data-value">Slices</span> with a minimum pass percentage of <span class="data-value">{{threshold}}%</span> will be considered a pass</div>
            <p class="control-note">Use 'Evaluate Scans' to help choose this. Affects 'Evaluate Users', 'See Results'</p>
          </div>
          <div class="submit-div"><b-button variant="danger" :disabled="submitDisabled" v-on:click="updateCharts">Submit</b-button></div>
          <hr class="seperator">
        </div>
      </div>
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
            <b-tab title="Evaluate Scans">
              <SurvivingSessions
              :dataset="submittedDataset"
              :minSwipes="submittedMinSwipes"
              :excludedUsers="excludedUsers"
              :sliceThreshold="submittedThreshold"
              :db="db"
              />
            </b-tab>
            <b-tab title="See Results">
              <SessionsPassFail
              :dataset="submittedDataset"
              :sliceThreshold="submittedThreshold"
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

<style scoped>
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
  #range-minSwipes, #range-threshold #range-session-threshold{
    max-width: 300px;
  }
  .data-value{
    font-weight: bold;
    font-size: 1.2em;
  }
  .center-flex {
    display: flex;
    justify-content: center;
  }
  .control-wrapper {
    display: flex;
    flex-direction: column;
  }
  .control-group {
    background-color: aliceblue;
    margin: 2px;
    padding: 4px;
    max-width: 500px;
  }
  .control-note {
    margin: 2px;
    font-size: 0.7em;
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
  import DatasetSelect from './Widgets/DatasetSelect';


  Vue.component('InterraterConcordance', InterraterConcordance);
  Vue.component('NumberOfSwipesByUser', NumberOfSwipesByUser);
  Vue.component('CatchTrialsByUser', CatchTrialsByUser);
  Vue.component('SurvivingSessions', SurvivngSessions);
  Vue.component('SessionsPassFail', SessionsPassFail);
  Vue.component('UserCorrectness', UserCorrectness);
  Vue.component('NumberOfVotes', NumberOfVotes);
  Vue.component('RecentSwipes', RecentSwipes);
  Vue.component('DatasetSelect', DatasetSelect);

  /**
   * Visualizations of study information.
   */
  export default {
    name: 'visualization',
    data() {
      return {
        sortedUsersList: [],
        selectedUsers: [],
        excludedUsers: [],
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
        threshold: 70,
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
        /**
         * whether to show the controls
         */
        showControls: false,
        /**
         * Whether the user has authenticated with Globus
         */
        globusAuthenticated: false,
        globusAuthErrors: [],

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
       * a list of the datasets that the logged in user is allowed to see
       */
      datasetPrivileges: {
        type: Object,
        required: true,
      },
      /**
       * configuration from firebase.
       */
      config: {
        type: Object,
        required: true,
      },
      /**
       * The auth token from Globus
       */
      globusToken: {
        type: String,
        required: true,
      },
      /**
       * function that exchanges the Globus token for user information
       */
      getGlobusIdentities: {
        type: Function,
        required: true,
      },
      /**
       * errors produced by brainswipes
       */
      errorCodes: {
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
      availableDatasets() {
        let availableDatasets = [];
        const allowedStudies = Object.keys(this.datasetPrivileges)
                    .filter(key => this.datasetPrivileges[key]);
        allowedStudies.forEach((study) => {
          console.log(study);
          if (this.config.studies[study].datasets) {
            availableDatasets = availableDatasets
              .concat(this.config.studies[study].datasets);
          }
        });
        console.log(availableDatasets);
        return availableDatasets;
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
      activateStudy() {
        this.showCharts = false;
        this.showControls = false;
      },
      activateDataset(study, dataset) {
        this.selectedDataset = dataset;
        this.updateCharts();
        this.showControls = true;
      },
      sortUsersList() {
        this.db.ref(`datasets/${this.selectedDataset}/userSeenSamples`).on('value', (snap) => {
          const userSeenSamples = snap.val();
          const users = Object.keys(userSeenSamples);
          this.selectedUsers = users;
          this.sortedUsersList = users.sort();
        });
      },
    },
    watch: {
      selectedDataset: {
        handler() {
          if (this.selectedDataset !== '') {
            this.sortUsersList();
          }
        },
        immediate: true,
        deep: true,
      },
    },
  };
</script>
