import { filter } from 'lodash';

import api from '@/api/index';
import mutationTypes from '@/store/mutation-types';

const state = {
	games: [],
	waitCreateGame: false,
	waitDeleteGame: false,
	waitLoadGames: false,
};

const getters = {};

const actions = {
	createGame({ commit }, playerId) {
		commit(mutationTypes.start.GAME_CREATE, { wait: true });

		api.games
			.create(playerId)
			.then(data => {
				commit(mutationTypes.start.GAME_CREATE, { wait: false });
				// Websocket will trigger 'wsGame/create'
			})
			.catch(err => {
				commit(mutationTypes.start.GAME_CREATE, { wait: false });
				this._vm.$log.error(err);
			});
	},

	deleteGame({ commit }, id) {
		commit(mutationTypes.start.GAME_DELETE, { wait: true });

		api.games
			.delete(id)
			.then(() => {
				// Websocket will trigger 'wsGame/delete'
				commit(mutationTypes.start.GAME_DELETE, { wait: false });
			})
			.catch(err => {
				// commit('GAME_DELETE', { wait: false });
				this._vm.$log.error(err);
			});
	},

	loadGames({ commit }) {
		commit(mutationTypes.start.GAMES_CLEAR);

		api.games
			.get()
			.then(data => {
				this._vm.$log.debug('start/loadGames', data);

				for (const game of data) {
					commit(mutationTypes.start.ADD_GAME, game);
				}
			})
			.catch(err => {
				this._vm.$log.error(err);
				this._vm.$toasted.error(err);
			});
	},
};

const mutations = {
	[mutationTypes.start.ADD_GAME](state, nuts) {
		state.games.push(nuts);
	},
	// Comes from websocket/wsGame (ws-game.js)
	[mutationTypes.start.DELETE_GAME](state, id) {
		state.games = filter(state.games, g => g.id !== id);
	},
	[mutationTypes.start.GAME_CREATE](state, payload) {
		state.waitCreateGame = payload.wait;
	},
	[mutationTypes.start.GAME_DELETE](state, payload) {
		state.waitDeleteGame = payload;
	},
	[mutationTypes.start.GAMES_CLEAR](state) {
		state.games = [];
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
