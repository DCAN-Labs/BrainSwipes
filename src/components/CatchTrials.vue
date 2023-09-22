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
      <h1>{{study}} | {{config.datasets[dataset].name}}</h1>
      <div>
        <table class="catch-table">
          <tr>
            <th class="catch-table">Image Type</th>
            <th class="catch-table">T1/T2</th>
            <th class="catch-table">Pass</th>
            <th class="catch-table">Fail</th>
          </tr>
          <tr v-for="imageClass in Object.keys(catchTrialSummary)" :key="imageClass">
            <td class="catch-table">{{imageClass}}</td>
            <td class="catch-table">
              <table class="sub-table">
                <tr>
                  <td>T1</td>
                </tr>
                <tr>
                  <td>T2</td>
                </tr>
              </table>  
            </td>
            <td class="catch-table">
              <table class="sub-table">
                <tr>
                  <td>{{catchTrialSummary[imageClass].T1.pass}}</td>
                </tr>
                <tr>
                  <td>{{catchTrialSummary[imageClass].T2.pass}}</td>
                </tr>
              </table>  
            </td>
            <td class="catch-table">
              <table class="sub-table">
                <tr>
                  <td>{{catchTrialSummary[imageClass].T1.fail}}</td>
                </tr>
                <tr>
                  <td>{{catchTrialSummary[imageClass].T2.fail}}</td>
                </tr>
              </table>  
            </td>
            </tr>
        </table>
        <br>
      </div>
      <div class="buttons">
        <div v-for="imageClass in Object.keys(catchTrials)" :key="imageClass">
          <b-button @click="chooseImageClass(imageClass)" :variant="imageClass === selectedImageClass ? 'primary' : 'outline-primary'">{{imageClass}}</b-button>
        </div>
      </div>
      <br>
      <div v-if="selectedImageClass">
        <b-button @click="selectedT1or2 = 'T1'" :variant="selectedT1or2 === 'T1' ? 'primary' : 'outline-primary'">T1</b-button>
        <b-button @click="selectedT1or2 = 'T2'" :variant="selectedT1or2 === 'T2' ? 'primary' : 'outline-primary'">T2</b-button>
        <hr>
        <div v-if="selectedT1or2">
          <div v-if="Object.hasOwn(catchTrials[selectedImageClass], selectedT1or2)">
            <div v-for="catchTrial in Object.keys(catchTrials[selectedImageClass][selectedT1or2])" :key="catchTrial">
              <h3>{{catchTrial}}</h3>
              <h3 :class="catchTrials[selectedImageClass][selectedT1or2][catchTrial]">{{catchTrials[selectedImageClass][selectedT1or2][catchTrial] == 'pass' ? 'PASS' : 'FAIL'}}</h3>
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
          <div v-else>
            No {{selectedImageClass}} {{selectedT1or2}} catch trials.
          </div>
        </div>
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
  .buttons {
    text-align: center;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .sub-table tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  .sub-table {
    width: 100%;
  }
  table {
    margin: auto;
  }
  th {
    font-weight: 800;
    width: 120px;
  }
  .catch-table {
    border: 2px solid black;
    border-collapse: collapse;
  }
</style>

<script>
  import 'firebase/auth';
  import 'firebase/database';
  import _ from 'lodash';
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
        /**
         * the selected dataset
         */
        dataset: '',
        /**
         * the selected study
         */
        study: '',
        /**
         * info from db/datasets/{dataset}/catch/sampleCounts
         */
        catchTrials: {},
        /**
         * info from db/datasets/{dataset}/catch/sampleSummary`
         */
        catchSummary: {},
        /**
         * which image type to show, anat, func, atlas, etc.
         */
        selectedImageClass: '',
        /**
         * which image type to show, T1 or T2
         */
        selectedT1or2: '',
        /**
         * parsed catch trial data for display in table
         */
        catchTrialSummary: {},
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
        this.selectedImageClass = '';
        this.selectedT1or2 = '';
        this.dataset = '';
        this.catchTrialSummary = {};
      },
      chooseImageClass(imageClass) {
        this.selectedImageClass = imageClass;
        this.selectedT1or2 = '';
      },
      /**
       * populates a list of catch trials for this dataset
       */
      getCatchTrials() {
        this.db.ref(`datasets/${this.dataset}/catch/sampleCounts`).on('value', (snap) => {
          const sampleCounts = snap.val();
          const catchTrials = {};
          if (sampleCounts) {
            Object.keys(sampleCounts).forEach((sample) => {
              const [imageClass, t1or2] = this.getImageType(sample);
              if (Object.hasOwn(catchTrials, imageClass)) {
                if (Object.hasOwn(catchTrials[imageClass], t1or2)) {
                  catchTrials[imageClass][t1or2][sample] = sampleCounts[sample];
                } else {
                  catchTrials[imageClass][t1or2] = { [sample]: sampleCounts[sample] };
                }
              } else {
                catchTrials[imageClass] = { [t1or2]: { [sample]: sampleCounts[sample] } };
              }
            });
            this.catchTrials = catchTrials;
            this.summarizeCatchTrials();
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
      getImageType(sample) {
        const imageType = [];
        if (Object.hasOwn(this.config.datasets[this.dataset], 'imageType')) {
          imageType[0] = this.config.datasets[this.dataset].imageType;
        } else if (sample.match(/atlas/i)) {
          imageType[0] = 'Atlas';
        } else if (sample.match(/task/i)) {
          imageType[0] = 'fMRI';
        } else {
          imageType[0] = 'Anat';
        }
        if (sample.match(/T1/i)) {
          imageType[1] = 'T1';
        } else if (sample.match(/T2/i)) {
          imageType[1] = 'T2';
        } else {
          imageType[0] = 'Other';
          imageType[1] = 'Other';
        }
        return imageType;
      },
      summarizeCatchTrials() {
        const summary = _.reduce(this.catchTrials, (summaryResult, imageClassValues, imageClass) => {
          summaryResult[imageClass] =
            _.reduce(imageClassValues, (imageClassResult, t1or2values, t1or2) => {
              imageClassResult[t1or2] = _.reduce(t1or2values, (t1or2result, sampleValues) => {
                t1or2result[sampleValues] += 1;
                return t1or2result;
              }, { pass: 0, fail: 0 });
              return imageClassResult;
            }, { T1: { pass: 0, fail: 0 }, T2: { pass: 0, fail: 0 } });
          return summaryResult;
        }, {});
        this.catchTrialSummary = summary;
      },
    },
  };
</script>