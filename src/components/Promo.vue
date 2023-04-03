<template>
  <div id="promo">
    <div id="promo-background" :style="backgroundStyles()"></div>
    <div id="promo-content">
      <h1>{{config.studies[study].about.title}}</h1>
      <p v-for="line in config.studies[study].about.text" :key="line" v-html="line"></p>
      <hr style="width: 80vw;">
      <h1>Available Datasets for {{study}}</h1>
      <div v-for="dataset in config.studies[study].datasets" :key="dataset">
        <h2>{{config.datasets[dataset].name}}</h2>
        <p v-for="line in config.datasets[dataset].about.text" :key="line" v-html="line"></p>
        <div v-if="config.datasets[dataset].archived" class="archived">
          <p>This dataset is archived and can no longer be swiped on.</p>
          <p>You can still view chats and results.</p>
        </div>
      </div>
      <div v-if="!config.studies[study].available">
        <hr>
        <p>If you believe you should have access to this study fill out the access form:</p>
        <b-button @click="routeToRequest" variant="warning">To Access Form</b-button>
      </div>
    </div>
  </div>

</template>

<style>
  #promo{
    height:100%;
  }
  #promo-background{
    height:100%;
  }
  #promo-background::before{
    content:"";
    position: absolute;
    left: 0px;
    height: 90%;
    width: 100%;
    background-color: rgba(255,255,255,0.95);
  }
  #promo-content{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    top: 12vh;
    width: 100vw;
  }
  #promo-content p{
    font-size: 1.1em;
    margin: 2px;
    max-width: 90vw;
  }
  .archived p{
    font-style: italic;
    color:gray;
  }
</style>

<script>
export default {
  name: 'promo',
  data() {
    return {
    };
  },
  props: {
    /**
    * The config object that is loaded from firebase
    */
    config: {
      type: Object,
      required: true,
    },
    study: {
      type: String,
      required: true,
    },
  },
  methods: {
    backgroundStyles() {
      return {
        'background-image': `url(/static/study_logos/${this.config.studies[this.study].about.logo})`,
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-attachment': 'fixed',
      };
    },
    routeToRequest() {
      this.$router.push({ name: 'AccessRequest' });
    },
  },
  /**
   * Reroutes users to Home if they attempt to go to an about page for a study that does not exist
   */
  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      /* eslint-disable no-underscore-dangle */
      const studies = await vm._props.config.studies;
      const studyList = Object.keys(studies);
      if (!studyList.includes(to.params.study)) {
        vm.$router.push({ name: 'Home' });
      }
      /* eslint-enable no-underscore-dangle */
    });
  },
};
</script>
