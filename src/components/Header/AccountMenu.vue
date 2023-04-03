<template>
  <div class="account-menu">
    <!-- Dropdown menu only available if user is logged in -->
    <div v-if="loggedIn" ref="account-menu-toggle" @click="toggleMenu">
      <div class="img-overlay-wrap">
        <img :src="profilePicURL" alt="Profile Avatar" class="avatar"/>
        <img src="/static/profile-frame.svg" class="profile-frame">
      </div>
      <div class="account-menu__user-information">
        <span class="username">{{userInfo.displayName}}</span>
        <span class="user-score">{{userData.score}}</span>
        <span :class="{ notification: notification }"></span>
      </div>
    </div>
    <!-- The login option shows if the user is not authenticated -->
    <ul v-else>
      <li>
        <router-link to="/login" class="nav__link">
          <i class="fa fa-user" aria-hidden="true"></i>
          Login or Sign Up
        </router-link>
      </li>
    </ul>
    <div
      class="account-menu__dropdown"
      v-if="isActive"
      v-click-outside="{exclude: ['account-menu-toggle'], handler: 'onClose'}"
    >
      <ul>
        <li>
          <router-link to="/profile">
          Profile
          </router-link>
        </li>
        <li>
          <span v-on:click="onClickLogout">Sign out</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
import ClickOutside from '../../directives/ClickOutside.js';

export default {
  name: 'AccountMenu',
  data() {
    return {
      isActive: false,
    };
  },
  props: {
    loggedIn: {
      type: Boolean,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    /**
     * keys: studies that user can access
     * values: does the user have a notification from that study, boolean
     */
    notifications: {
      type: Object,
      required: true,
    },
  },
  computed: {
    /**
    * Does the user have any notifications
    */
    notification() {
      let notification = false;
      Object.keys(this.notifications).forEach((study) => {
        notification = notification || this.notifications[study];
      });
      return notification;
    },
    /**
     * url of the icon to use as a profile picture
     */
    profilePicURL() {
      let profilePicURL = '/static/profile_pics/kesh-profile-icon.svg';
      if (this.userData.pic) {
        profilePicURL = `/static/profile_pics/${this.userData.pic}.svg`;
      }
      return profilePicURL;
    },
  },
  methods: {
    onClose() {
      this.isActive = false;
    },
    toggleMenu() {
      this.isActive = !this.isActive;
    },
    onClickLogout() {
      this.$emit('logout');
    },
  },
  directives: {
    ClickOutside,
  },
  watch: {
    $route() {
      this.isActive = false;
    },
  },
};
</script>

<style>
/* Account Menu */
.account-menu {
  display: block;
  user-select: none;
  font-weight: 700;
  color: rgb(100, 0, 0);
  font-weight: 600;
  cursor: pointer;
}

.account-menu .img-overlay-wrap,
.account-menu .user-score {
  display: none;
}

.account-menu__dropdown {
  display: block;
  width: 14.5em;
  background-color: hsl(0, 0%, 100%);
  position: absolute;
  right: 1.25em;
  top: 50px;
  z-index: 100;
  padding: 1em 1.25em;
  border-radius: 7px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}
.account-menu__dropdown ul li {
  line-height: 50px;
  font-weight: 400;
  font-size: 1.125em;
}
.notification::after {
  display: block;
  content: '';
  background-image: url('../../assets/envelope-fill.svg');
  background-repeat: no-repeat;
  background-size: 16px 16px;
  height: 16px;
  width: 16px;
}

@media (min-width: 65em) {
  .account-menu > div {
    display: flex;
  }
  .account-menu .user-score {
    display: block;
    top: 0.6em;
    left: 0px;
    padding: 0px 5px;
    border-radius: 3px;
    font-size: 1.2em;
    line-height: 1.5em;
    color: rgb(100, 0, 0);
    font-weight: 700;
    background-color: rgb(255,202,30)
  }
  .account-menu__user-information {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: flex-start;
    height: 5em;
    font-size: 0.75em;
  }
  .account-menu__user-information .username {
    position: relative;
    font-weight: 700;
    font-size: 1.375em;
    color: rgb(100, 0, 0);  
  }
  .account-menu__dropdown {
    top: 100px;
  }
  .account-menu .img-overlay-wrap {
    position: relative;
    display: inline-block;
    width: 4em;
    margin-right: 1em;
  }
  .account-menu .img-overlay-wrap .avatar {
    display: block;
    max-width: 100%;
    height: auto;
  }
  .account-menu .img-overlay-wrap .profile-frame {
    position: absolute;
    top: 0;
    left: 0;
  }

}
</style>
