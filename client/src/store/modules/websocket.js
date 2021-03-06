import Vue from 'vue';
import router from '@/routes';

import wsDecks from '@/store/modules/websocket/wsDecks';
import wsGame from '@/store/modules/websocket/wsGame';
import wsPlayers from '@/store/modules/websocket/wsPlayers';
import mutationTypes from '@/store/mutation-types';

const state = {
	isConnected: false,
	isOpen: false,
	message: '',
	reconnectError: false,
};

const getters = {
	isConnected: state => {
		return state.isConnected;
	},
};

const actions = {};

const mutations = {
	[mutationTypes.websocket.SOCKET_ONOPEN](state, event) {
		Vue.$log.info(state, event);
		state.isConnected = true;
		state.isOpen = true;
	},
	[mutationTypes.websocket.SOCKET_ONCLOSE](state, event) {
		Vue.$log.info(state, event);

		if (router.currentRoute.path !== '/offline') {
			router.push('/offline');
		}

		state.isConnected = false;
		state.isOpen = false;
	},
	[mutationTypes.websocket.SOCKET_ONERROR](state, event) {
		if (state.isOpen) {
			// Only display error if the error wasn't from socket close
			Vue.$log.error(state, event);
		}

		if (router.currentRoute.path !== '/offline') {
			router.push('/offline');
		}
	},
	[mutationTypes.websocket.SOCKET_ONMESSAGE](state, message) {
		Vue.$log.debug(state, message);
		state.message = message;
	},
	// mutations for reconnect methods
	[mutationTypes.websocket.SOCKET_RECONNECT](state, count) {
		Vue.$log.info(state, count);
	},
	// mutations for reconnect methods
	[mutationTypes.websocket.SOCKET_RECONNECT_ERROR](state, count) {
		Vue.$log.error(state, count);
	},
};

export default {
	// Can't use namespace until Issue is fixed: https://github.com/nathantsoi/vue-native-websocket/issues/40
	// namespaced: true,
	modules: {
		wsDecks,
		wsGame,
		wsPlayers,
	},
	state,
	getters,
	actions,
	mutations,
};
