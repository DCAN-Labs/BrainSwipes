<template name="catch-trials">
  <div id="catch-trials" class="container">
    <DatasetSelect
      :globusToken="globusToken"
      :getGlobusIdentities="getGlobusIdentities"
      :config="config"
      :datasetPrivileges="datasetPrivileges"
      :surpressArchived="false"
      :showUnavailable="true"
      :useGlobus="false"
      :userInfo="userInfo"
      redirectPath=""
      redirectComponent=""
      @activateDataset="activateDataset"
      @activateStudy="activateStudy"
    />
    <div v-if="dataset">
      <div v-for="catchTrial in Object.keys(catchTrials)" :key="catchTrial">
        <h2>{{catchTrial}}</h2>
        <h3 :class="catchTrials[catchTrial]">{{catchTrials[catchTrial] == 'pass' ? 'PASS' : 'FAIL'}}</h3>
        <br>
        <ImageSwipe
          :widgetPointer="catchTrial"
          :widgetSummary="catchSummary[catchTrial]"
          :playMode="''"
          ref="widget"
          :dataset="dataset"
          :study="study"
          :config="config"
        />
        <b-button :to="`/${study}/${dataset}/review/${catchTrial}`">Review</b-button>
        <hr>
      </div>
    </div>
  </div>
</template>

<style scoped>
  #catch-trials {
    padding-bottom: 10vh;
  }
  .fail {
    color: red;
  }
  .pass {
    color: green;
  }
</style>

<script>
  import 'firebase/auth';
  import 'firebase/database';
  import ImageSwipe from './Widgets/ImageSwipe';
  import DatasetSelect from './Widgets/DatasetSelect';

  export default {
    name: 'catch-trials',
    components: {
      ImageSwipe,
      DatasetSelect,
    },
    data() {
      return {
        dataset: '',
        study: '',
        catchTrials: {},
        catchSummary: {},
      };
    },
    props: {
      /**
       * the computed user data object based on userInfo
       */
      userData: {
        type: Object,
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
       * the configuration from firebase
       */
      config: {
        type: Object,
        required: true,
      },
      /**
       * the studies the user is allowed to see
       */
      datasetPrivileges: {
        type: Object,
        required: true,
      },
      /**
       * the authenticated user object from firebase
       */
      userInfo: {
        type: Object,
        required: true,
      },
    },
    methods: {
      activateDataset(study, dataset) {
        this.dataset = dataset;
        this.study = study;
        this.getCatchTrials();
        this.getCatchSummary();
      },
      activateStudy(study) {
        this.study = study;
        this.catchTrials = {};
        this.catchSummary = {};
        this.dataset = '';
      },
      /**
       * populates a list of catch trials for this dataset
       */
      getCatchTrials() {
        this.db.ref(`datasets/${this.dataset}/catch/sampleCounts`).on('value', (snap) => {
          const sampleCounts = snap.val();
          if (sampleCounts) {
            this.catchTrials = sampleCounts;
          }
        });
      },
      getCatchSummary() {
        this.db.ref(`datasets/${this.dataset}/catch/sampleSummary`).on('value', (snap) => {
          const sampleSummary = snap.val();
          if (sampleSummary) {
            this.catchSummary = sampleSummary;
          }
        });
      },
    },
  };
</script>