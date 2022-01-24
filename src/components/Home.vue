<template>
  <div class="home container">
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <h1>{{title}}</h1>
        <p class="lead mt-3">
          {{tagline}}
        </p>
      </div>
      <p class="buttons mt-3">
        <router-link class="btn btn-primary white" :to="{name: 'Play', query: routerQuery}"> BCP </router-link>
        <router-link class="btn btn-primary white" :disabled="!activeABCD" :event="activeABCD ? 'click' : ''" :to="{name: 'PlayABCD', query: routerQuery}" v-bind:class="{ turnedoff: !activeABCD }">
          <span>
            ABCD
          </span>
        </router-link>
      </p>
    </div>
  </div>


</template>

<script>
/**
 * The landing page, on the route `/`. This component displays a title, tagline,
 * and background image splash page that's defined on the config property.
 */
import firebase from 'firebase';

export default {
  name: 'Home',
  props: {
    /**
     * The config object that is loaded from src/config.js.
     * It defines how the app is configured, including
     * any content that needs to be displayed (app title, images, etc)
     * and also the type of widget and where to update pointers to data
     */
    config: {
      type: Object,
      required: true,
    },
    routerQuery: {
      type: Object,
    },
  },
  data() {
    return {
      activeABCD: false,
    };
  },
  computed: {
    /**
     * The title to display. Defined in `config.home.title`
     */
    title() {
      return this.config.home.title;
    },
    /**
     * The tagline to display. Defined in `config.home.tagline`
     */
    tagline() {
      return this.config.home.tagline;
    },
    /**
     * The background image to display. Defined in `config.home.backgroundUrl`
     */
    landingStyle() {
      return { 'background-image': `url("${this.config.home.backgroundUrl}")` };
    },
  },
  async created() {
    await this.activateABCD();
  },
  methods: {
    async activateABCD() {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        firebase.database().ref(`/users/${currentUser.displayName}/datasets/ABCD`).once('value')
          .then((snap) => {
            this.activeABCD = snap.val();
          });
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

h1, h2 {
  font-weight: bold;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.home {
  text-align: left;
}

.home h1 {
  text-align: center;
}

.buttons {
  text-align: center;
}

.landing {
  background-color: white;
  /* background-image: url('../assets/whaldrStatic.png'); */
  background-repeat: no-repeat;
  background-position: center;
  height: 80vh;
  text-align: center;
}

.landing h1 {
  color: black;
  max-width: 350px;
  margin: auto;
}

.landing .lead {
  color: black;
  max-width: 250px;
  margin: auto;
}

.white {
  color: white;
}

.btn-primary {
  color: #fff;
  background-color: maroon;
  border-color: maroon;
}

.turnedoff{
  background-color: rgba(128, 0, 0, 0.3);
}
.jumbotron {
    padding: 2rem 1rem;
    margin-bottom: 0rem;
}

#titles {
  padding: 0.4rem;
  margin: 0 auto; 
  text-shadow: white 1px 1px, white 0 0 1px;
}

.turnedoff:hover{
  cursor: not-allowed;
}

.turnedoff:hover span {
  display: none;
}

.turnedoff:hover:before {
  content: 'Unavailable';
}

</style>
