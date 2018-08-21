import Vue from 'vue';

import api from '@/api/index';

const state = {
	games: [],
	waitCreateGame: false,
	waitDeleteGame: false,
	waitLoadGames: false,
};

const getters = {};

const actions = {
	createGame({ commit }) {
		commit('GAME_CREATE', { wait: true });

		api.games
			.create()
			.then(res => {
				let game = res.data;

				this._vm.$log.debug('start/createGame', this, game);

				commit('GAME_CREATE', { wait: false });
				// Websocket will trigger 'wsGame/create'
			})
			.catch(err => {
				commit('GAME_CREATE', { wait: false });
				this._vm.$log.error(err);
			});
	},

	deleteGame({ commit }, id) {
		commit('GAME_DELETE', { wait: true });

		api.games
			.delete(id)
			.then(() => {
				// Websocket will trigger 'wsGame/delete'
				commit('GAME_DELETE', { wait: false });
			})
			.catch(err => {
				commit('GAME_DELETE', { wait: false });
				this.$log.error(err);
			});
	},

	loadGames({ commit }) {
		commit('GAMES_LOAD', { wait: true });

		api.games
			.get()
			.then(res => {
				if (res.status === 200) {
					let gamesData = res.data;

					this._vm.$log.debug('start/loadGames', gamesData);

					commit('GAMES_LOAD', { wait: false });

					for (let game of gamesData) {
						commit('ADD_GAME', game);
					}
				}
			})
			.catch(err => {
				commit('GAMES_LOAD', { wait: false });
				this._vm.$log.error(err);
			});
	},
};

const mutations = {
	ADD_GAME(state, nuts) {
		state.games.push(nuts);
	},
	// Comes from websocket/wsGame (ws-game.js)
	DELETE_GAME(state, id) {
		state.games = _.filter(state.games, g => g.id !== id);
	},
	GAME_CREATE(state, payload) {
		state.waitCreateGame = payload.wait;
	},
	GAME_DELETE(state, payload) {
		state.waitDeleteGame = payload;
	},
	GAMES_LOAD(state) {
		state.waitLoadGames = false;
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
