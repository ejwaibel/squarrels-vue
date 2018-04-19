import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import BootstrapVue from 'bootstrap-vue';
import Vue from 'vue';
import VueLogger from 'vuejs-logger';
import App from './App.vue';

import config from './config';
import router from './router';
import store from './store/index';

Vue.use(BootstrapVue);
Vue.use(VueLogger, config.logOptions);

Vue.prototype.$config = config;
Vue.config.productionTip = false;

new Vue({
	router,
	store,
	render: h => h(App),
}).$mount('#app');