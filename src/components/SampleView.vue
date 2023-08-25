<template>
  <div id="sample-view">
    <h1>View a Sample</h1>
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
      @activateDataset="setDataset"
      @activateStudy="dataset = ''"
    />
    <div class="selector-wrapper">
      <div v-if="dataset" class="sample-selector">
        <h2>{{study}}</h2>
        <h3>{{dataset}}</h3>
        <br>
        <b-form-input
          id="sample-input"
          v-model="sample"
          placeholder="Enter sample name"
          required
        ></b-form-input>
        <br>
        <b-button 
          @click="selectedSample = sample"
          variant="warning"
        >
          View Sample
        </b-button>
      </div>
    </div>
    <div v-if="selectedSample">
      <hr>
      <h2>{{selectedSample}}</h2>
      <ImageStatic
        :widgetPointer="selectedSample"
        :dataset="dataset"
        :config="config"
      />
      <br>
      <b-button
        :to="`/${study}/${dataset}/review/${selectedSample}?f=v`"
      >
        Review Sample Data
      </b-button>
    </div>
  </div>
</template>

<style scoped>
  #sample-view {
    padding-bottom: 12vh;
  }
  .selector-wrapper {
    display: flex;
    justify-content: center;
  }
  .sample-selector {
    width: 500px;
  }
</style>

<script>

/**
 * Forwards to reivew without refreshing the page.
 * This makes reviewing a specific sample possible when globus login is required.
 */
import DatasetSelect from './Widgets/DatasetSelect';
import ImageStatic from './Widgets/ImageStatic';

export default {
  name: 'sample-view',
  data() {
    return {
      /**
       * Models input to help set the sample to view
       */
      sample: '',
      /**
       * The sample name passed to the view widget.
       * Copies 'sample' when user clicks 'view sample' button
       */
      selectedSample: '',
      /**
       * the dataset the sample is from
       */
      dataset: '',
      /**
       * the study the sample is from
       */
      study: '',
    };
  },
  props: {
    /**
     * the studies the user is allowed to see
     */
    datasetPrivileges: {
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
     * user info from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
  },
  methods: {
    /**
     * gets dataset from dataset selector widget
     * and sets dataset in this component
     */
    setDataset(study, dataset) {
      const errors = [];
      this.study = study;
      this.dataset = dataset;
      if (!this.config.studies[study].available) {
        if (!this.globusToken) {
          errors.push('noIdentities');
        }
      }
      if (errors.length) {
        this.$router.push({ name: 'Restricted', query: { errors } });
      } else {
        this.$emit('changeDataset', dataset, study);
      }
    },
    /**
     * handles reroute from review page
     */
    async handleQuery() {
      const query = this.$route.query;
      if (query.study && query.dataset) {
        const study = query.study;
        const dataset = query.dataset;
        this.setDataset(study, dataset);
        this.selectedSample = query.sample;
      }
    },
  },
  mounted() {
    this.handleQuery();
  },
  components: {
    DatasetSelect,
    ImageStatic,
  },
};
</script>
