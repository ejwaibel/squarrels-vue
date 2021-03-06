import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '@/store/index';

import DemoIndex from '@/views/demo/index.vue';
import Game from '@/views/Game.vue';
import Login from '@/views/Login.vue';
import Offline from '@/views/Offline.vue';
import Start from '@/views/Start.vue';

Vue.use(VueRouter);

const router = new VueRouter({
	mode: 'history',
	routes: [
		{
			path: '/demo/:routeName',
			name: 'demo',
			component: DemoIndex,
			props: true,
		},
		{
			path: '/offline',
			name: 'offline',
			component: Offline,
		},
		{
			path: '/login',
			name: 'login',
			component: Login,
		},
		{
			path: '/game/:id',
			name: 'game',
			component: Game,
			props: true,
		},
		{
			path: '/',
			name: 'start',
			component: Start,
		},
	],
});

router.beforeEach((to, from, next) => {
	Vue.$log.debug('router.beforeEach', store, to, from);

	const currentRoute = router.currentRoute;

	Vue.$log.info(router.currentRoute);

	if (to.name === 'offline' || router.currentRoute.name === 'offline') {
		return next();
	}

	store
		.dispatch('checkLogin')
		.then(pl => {
			const data = pl;

			data.isCurrent = true;

			Vue.$log.debug('playerLogin -> ', pl);

			store.dispatch('players/update', { id: pl.id, data });

			if (to.path === '/login') {
				next('/');
			} else {
				next();
			}
		})
		.catch(err => {
			Vue.$log.error(err);

			if (currentRoute !== '/login' && to.path !== '/login') {
				next('/login');
			} else {
				next();
			}
		});
});

export default router;
