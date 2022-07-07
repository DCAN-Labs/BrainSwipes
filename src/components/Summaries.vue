<template>
  <div id="summaries">
    <h1> Summary </h1>

    <b-container>
      <div>
        <b-dropdown variant="warning" class="datasetsDropdown" :text="submittedDataset ? submittedDataset : 'Select Study'" ref="datasetDropdown">
          <b-dropdown-form>
            <b-form-radio-group
              id="radio-datasets"
              v-model="selectedDataset"
              :options="Object.keys(studies)"
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
      <div class="submit-div"><b-button variant="danger" :disabled="submitDisabled" v-on:click="updateCharts">Submit</b-button></div>
      <div id="charts" v-if="showCharts">
        <!-- <InterraterConcordance
        :dataset="dataset"
        :db="db"
        :gradientArray="gradientArray"
        /> -->
        <SurvivingSessions
        :dataset="submittedDataset"
        :minSwipes="submittedMinSwipes"
        :excludedUsers="excludedUsers"
        :db="db"
        />
        <UserCorrectness
        :dataset="submittedDataset"
        :threshold="threshold"
        :minVotes="submittedMinSwipes"
        :db="db"
        :gradientArray="gradientArray"
        />
      </div>
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
        threshold: 0.7,
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
       * it comes directly from the `/uids` document in Firebase.
       */
      allUsers: {
        type: Object,
        required: true,
      },
      /**
       * the list of datasets available to QC
       */
      studies: {
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
      updateCharts() {
        this.submitDisabled = true;
        this.submittedMinSwipes = this.minSwipes;
        this.submittedDataset = this.selectedDataset;
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
