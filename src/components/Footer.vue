<template>
  <footer>
    <div class="footer__container">
      <a href="https://innovation.umn.edu/developmental-cognition-and-neuroimaging-lab/" target="_blank"><img src="../assets/DCAN-logo.png" alt="DCAN logo" class="logo"></a>
      <nav v-if="loadingAdmin">
      </nav>
      <nav v-else>
        <router-link
          v-if="isAdmin" :to="'/admin'" class="nav__link">
          Admin
        </router-link>
        <router-link
          v-for="menuItem in menuItems"
          :key="menuItem.name"
          :to="menuItem.path"
          class="nav__link"
        >{{menuItem.name}}</router-link>
        <div v-if="completedTutorial" class="dropdown" @mouseover="hoverLearn = true" @mouseleave="hoverLearn = false">
          <div v-show="hoverLearn">
            <div class="dropdown-content">
              <a @click="routeTo('TutorialSelect')" class="nav__link">Tutorials</a>
              <a @click="routeTo('Practice')" class="nav__link">Practice</a>
              <a @click="routeTo('Gallery')" class="nav__link">Gallery</a>
            </div>
          </div>
          <a class="nav__link dropdown-button">Learn</a>
        </div>
        <router-link v-else to="/tutorial/basic" class="nav__link">Learn</router-link>
      </nav>

    </div>
  </footer>
</template>
<script>
/**
    Footer component with useful links and stuff.
  */
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

export default {
  name: 'Footer',
  props: {
    dataset: {
      type: String,
      requred: true,
    },
    datasetPrivileges: {
      type: Object,
      required: true,
    },
    config: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      menuItems: [
        { path: '/', name: 'Home' },
        { path: '/leaderboard', name: 'Leaderboard' },
        { path: '/about', name: 'About' },
        { path: '/results', name: 'Results' },
        { path: '/chats', name: 'Chats' },
      ],
      isAdmin: false,
      loadingAdmin: true,
      hoverLearn: false,
    };
  },
  mounted() {
    firebase.auth().onAuthStateChanged(() => {
      this.loadingAdmin = true;
      this.loadingLearn = true;
      this.addAdminRoutes();
    });
  },
  async created() {
    await this.addAdminRoutes();
  },
  methods: {
    async addAdminRoutes() {
      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdTokenResult(true).then((idTokenResult) => {
          if (idTokenResult.claims.admin ||
            Object.values(idTokenResult.claims.studyAdmin).includes(true)) {
            this.isAdmin = true;
            this.loadingAdmin = false;
          } else {
            this.isAdmin = false;
            this.loadingAdmin = false;
          }
        });
      } else {
        this.isAdmin = false;
        this.loadingAdmin = false;
      }
    },
    routeTo(route) {
      const path = { name: route };
      this.$router.push(path);
    },
  },
  computed: {
    completedTutorial() {
      let completedTutorial = false;
      if (Object.keys(this.userData).length) {
        if (Object.hasOwn(this.userData, 'tutorials')) {
          if (Object.hasOwn(this.userData.tutorials, 'basic')) {
            completedTutorial = this.userData.tutorials.basic === 'complete';
          }
        }
      }
      return completedTutorial;
    },
  },
};
</script>

<style scoped>
footer {
  width: 100%;
  position: fixed;
  padding: 1.25em;
  height: 10vh;
  background-color: white;
  z-index: 2;
}
.footer__container {
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer__container .logo {
  width: 3em;
}
.footer__container nav {
  display: flex;
  flex-wrap: wrap;
  width: 60%;
}

.footer__container nav a {
  display: block;
  width: 50%;
  height: 2em;
  text-align: left;
  color: rgb(100, 0, 0);
}
@media (min-width: 65em) {
  footer {
    padding: 2em;
  }
  .footer__container .logo {
    width: 3em;
    vertical-align: middle;
    padding: 2px;
  }
  .footer__container {
    max-width: 65em;
  }
  .footer__container nav {
    flex-wrap: nowrap;
    justify-content: space-between;
  }
  .footer__container nav a {
    width: auto;
    height: auto;
  }
}

/*footer*/
.col_white_amrc {
  color: #fff;
}
.pt2 {
  padding-top: 40px;
  margin-bottom: 20px;
}
footer p {
  font-size: 13px;
  color: #ccc;
  padding-bottom: 0px;
  margin-bottom: 8px;
}
.mb10 {
  padding-bottom: 15px;
}
.footer_ul_amrc {
  margin: 0px;
  list-style-type: none;
  font-size: 14px;
  padding: 0px 0px 10px 0px;
}
.footer_ul_amrc li {
  padding: 0px 0px 5px 0px;
}
.footer_ul_amrc li a {
  color: #ccc;
}
.footer_ul_amrc li a:hover {
  color: #fff;
  text-decoration: none;
}
.fleft {
  float: left;
}
.padding-right {
  padding-right: 10px;
}

.footer_ul2_amrc {
  margin: 0px;
  list-style-type: none;
  padding: 0px;
}
.footer_ul2_amrc li p {
  display: table;
}
.footer_ul2_amrc li a:hover {
  text-decoration: none;
}
.footer_ul2_amrc li i {
  margin-top: 5px;
}

.bottom_border {
  border-bottom: 1px solid #323f45;
  padding-bottom: 20px;
}
.foote_bottom_ul_amrc {
  list-style-type: none;
  padding: 0px;
  display: table;
  margin-top: 10px;
  margin-right: auto;
  margin-bottom: 10px;
  margin-left: auto;
}
.foote_bottom_ul_amrc li {
  display: inline;
}
.foote_bottom_ul_amrc li a {
  color: #999;
  margin: 0 12px;
}

.social_footer_ul {
  display: table;
  margin: 15px auto 0 auto;
  list-style-type: none;
}
.social_footer_ul li {
  padding-left: 20px;
  padding-top: 10px;
  float: left;
}
.social_footer_ul li a {
  color: #ccc;
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 50%;
}
.social_footer_ul li i {
  width: 20px;
  height: 20px;
  text-align: center;
}
.dropdown-content {
  position: absolute;
  bottom: 100%;
}
</style>
