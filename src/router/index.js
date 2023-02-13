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
import Visualization from '@/components/Visualization';
import Restricted from '@/components/Restricted';
import Results from '@/components/Results';
import Practice from '@/components/Practice';
import Gallery from '@/components/Gallery';
import Promo from '@/components/Promo';
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
      path: '/:study/:dataset/play',
      name: 'Play',
      component: Play,
      meta: {
        requiresAuth: true,
        requiresAccess: true,
        requiresTutorial: true,
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
      path: '/visualization',
      name: 'Visualization',
      component: Visualization,
      meta: {
        requiresAdmin: true,
      },
    },
    {
      path: '/chats',
      name: 'Chats',
      component: Chats,
      meta: {
        requiresAuth: true,
        requiresTutorial: true,
      },
    },
    {
      path: '/:study/:dataset/review/:key/',
      name: 'Review',
      component: Review,
      props: route => ({
        widgetPointer: route.params.key,
        study: route.params.study,
        dataset: route.params.dataset,
      }),
      meta: {
        requiresAccess: true,
        requiresTutorial: true,
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
    {
      path: '/restricted',
      name: 'Restricted',
      component: Restricted,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/results',
      name: 'Results',
      component: Results,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/practice',
      name: 'Practice',
      component: Practice,
    },
    {
      path: '/gallery',
      name: 'Gallery',
      component: Gallery,
    },
    {
      path: '/:study/about/',
      name: 'Promo',
      component: Promo,
      props: route => ({ study: route.params.study }),
    },
  ],
});

/**
 * Check user roles and access
 */
async function getUserRoles() {
  const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
  const userRoles = idTokenResult.claims;
  return userRoles;
}

router.beforeEach((to, from, next) => {
  const currentUser = firebase.auth().currentUser;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresAccess = to.matched.some(record => record.meta.requiresAccess);
  const requiresTutorial = to.matched.some(record => record.meta.requiresTutorial);


  if (requiresAuth && !currentUser) {
    next({ path: '/login', query: from.query });
  }
  // make sure the user has take the tutorial
  if (requiresTutorial) {
    if (currentUser) {
      firebase.database().ref(`/users/${currentUser.displayName}`).once('value')
        .then((snap) => {
          const data = snap.val();
          if (data.takenTutorial === 'needsPractice') {
            next({ path: '/practice', query: from.query });
          } else if (data.takenTutorial !== 'complete') {
            next({ path: '/tutorial', query: from.query });
          }
        });
    } else {
      next({ path: '/login', query: from.query });
    }
  }

  if (requiresAccess) {
    const study = to.params.study;
    getUserRoles().then((userRoles) => {
      if (!userRoles.datasets[study]) {
        next({ path: '/unauthorized', query: from.query });
      }
    });
  }

  if (requiresAdmin) {
    getUserRoles().then((userRoles) => {
      if (!userRoles.admin && !Object.values(userRoles.studyAdmin).includes(true)) {
        next({ path: '/unauthorized', query: from.query });
      } else next();
    });
  } else {
    next();
  }
});

export default router;
