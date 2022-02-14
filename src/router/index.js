import Vue from 'vue';
import Router from 'vue-router';
import About from '@/components/About';
import Admin from '@/components/Admin';
import Home from '@/components/Home';
import Profile from '@/components/Profile';
import Play from '@/components/Play';
import Login from '@/components/Login';
import SignUp from '@/components/SignUp';
import Terms from '@/components/Terms';
import Unauthorized from '@/components/Unauthorized';
import Leaderboard from '@/components/Leaderboard';
import Tutorial from '@/components/Tutorial';
import Review from '@/components/Review';
import Chats from '@/components/Chats';
import Users from '@/components/Users';
import Manifest from '@/components/Manifest';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

Vue.use(Router);

const router = new Router({
  scrollBehavior() {
    // args can be (to, from, savedPosition)
    // return desired position
    return { x: 0, y: 0 };
  },
  mode: 'history',
  routes: [
    {
      path: '*', // redirect to login view
      redirect: '/',
    },
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/:dataset/play',
      name: 'Play',
      component: Play,
      meta: {
        requiresAuth: true,
        requiresAccess: true,
      },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: SignUp,
    },
    {
      path: '/terms',
      name: 'Terms',
      component: Terms,
    },
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: Unauthorized,
    },
    {
      path: '/leaderboard',
      name: 'Leaderboard',
      component: Leaderboard,
    },
    {
      path: '/tutorial',
      name: 'Tutorial',
      component: Tutorial,
    },
    {
      path: '/:dataset/chats',
      name: 'Chats',
      component: Chats,
      meta: {
        requiresAuth: true,
        requiresAccess: true,
      },
    },
    {
      path: '/:dataset/review/:key/:bucket',
      name: 'Review',
      component: Review,
      props: route => ({ widgetPointer: route.params.key, bucket: Buffer.from(route.params.bucket, 'base64').toString(), dataset: route.params.dataset }),
      meta: {
        requiresAccess: true,
      },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/users',
      name: 'Users',
      component: Users,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/manifest',
      name: 'Manifest',
      component: Manifest,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const currentUser = firebase.auth().currentUser;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresAccess = to.matched.some(record => record.meta.requiresAccess);

  if (requiresAuth && !currentUser) {
    next({ path: '/login', query: from.query });
  }
  // make sure the user has take the tutorial
  if (to.name === 'Play') {
    if (currentUser) {
      firebase.database().ref(`/users/${currentUser.displayName}`).once('value')
        .then((snap) => {
          const data = snap.val();
          if (!data.taken_tutorial) {
            next({ path: '/tutorial', query: from.query });
          }
        });
    } else {
      next({ path: '/login', query: from.query });
    }
  }

  if (requiresAccess) {
    const dataset = to.params.dataset;
    firebase.database().ref(`/users/${currentUser.displayName}/datasets`).once('value')
      .then((snap) => {
        const data = snap.val();
        if (!data[dataset]) {
          next({ path: '/unauthorized', query: from.query });
        }
      });
  }

  if (requiresAdmin) {
    // console.log('requires admin');
    firebase.database().ref(`/users/${currentUser.displayName}/admin`).once('value')
    .then((snap) => {
      // console.log('snap is', snap.val());
      if (requiresAdmin && !snap.val()) next('unauthorized');
      else next();
    });
  } else {
    next();
  }
});

export default router;
