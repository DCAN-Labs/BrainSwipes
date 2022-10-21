<template>
  <div id="promo">
    <div id="promo-background" :style="backgroundStyles()"></div>
    <div id="promo-content">
      <h1>{{config.studies[dataset].about.title}}</h1>
      <p v-for="line in config.studies[dataset].about.text" :key="line" v-html="line"></p>
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
  #promo-content h1{
    font-size: 2em;
    margin-bottom: 7px;
  }
  #promo-content p{
    font-size: 1.1em;
    margin: 2px;
    max-width: 90vw;
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
    dataset: {
      type: String,
      required: true,
    },
  },
  methods: {
    backgroundStyles() {
      return {
        'background-image': `url(/src/assets/${this.config.studies[this.dataset].about.logo})`,
        'background-position': 'center',
        'background-repeat': 'no-repeat',
      };
    },
  },
  /**
   * Reroutes users to Home if they attempt to go to an about page for a dataset that does not exist
   */
  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      /* eslint-disable no-underscore-dangle */
      const studies = await vm._props.config.studies;
      const studyList = Object.keys(studies);
      if (!studyList.includes(to.params.dataset)) {
        vm.$router.push({ name: 'Home' });
      }
      /* eslint-enable no-underscore-dangle */
    });
  },
};
</script>
