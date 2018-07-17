import Vue from 'vue';
import utils from '@/utils';
import _ from 'lodash';

import api from '@/api/index';

const plDefault = {
	name: utils.getRandomStr(12),
};

const state = {
	ids: [],
};

const getters = {
	canDrawCard: (state, getter, rootState, rootGetters) => {
		const myPlayer = getter.getMyPlayer;

		Vue.$log.debug(state, myPlayer);

		return (
			myPlayer.isActive &&
			!rootGetters['game/isActionCard']() &&
			myPlayer.cardsInHand &&
			(myPlayer.cardsInHand.length < 7 || !myPlayer.hasDrawnCard)
		);
	},

	canDiscardCard: (state, getter) => {
		const myPlayer = getter.getMyPlayer;

		return myPlayer.isActive && myPlayer.hasDrawnCard;
	},

	getById: state => id => {
		return state[id] || {};
	},

	getByProp: state => (prop, value, options = {}) => {
		let index = options.index || false;
		let all = options.all || false;

		Vue.$log.debug('get()', prop, value, index);

		let method = index ? 'findIndex' : all ? 'filter' : 'find';

		if (prop) {
			if (value) {
				return _[method](state, function(o) {
					return o[prop] === value;
				});
			}

			// If a 'value' wasn't given, then we're just looking for the player
			// where the supplied 'prop' is !null/undefined
			return _[method](state, prop);
		}

		return state;
	},

	getMyPlayer: (state, getters, rootState) => {
		Vue.$log.debug('getMyPlayer()', state, rootState);

		for (let id in state) {
			if (id === rootState.localPlayer.id) {
				return state[id];
			}
		}

		return { id: '' };
	},

	getNextPlayer: state => activeIndex => {
		Vue.$log.debug('getNextPlayer()', activeIndex, state);

		if (activeIndex === -1) {
			// Get random player from list of player IDs
			return _.sample(state.ids);
		} else if (activeIndex === state.ids.length - 1) {
			// Reset active player to first player
			activeIndex = 0;
		} else {
			activeIndex++;
		}

		return state.ids[activeIndex];
	},

	totalPlayers: state => {
		return state.ids.length;
	},
};

const actions = {
	add({ commit }, plArr) {
		this._vm.$log.debug('add()', plArr);

		if (plArr.length) {
			return api.players
				.get(plArr.join(','))
				.then(res => {
					if (res.status === 200) {
						commit('UPDATE', res.data[0]);
					}
				})
				.catch(err => {
					this._vm.$log.error(err);
				});
		}
	},

	addCards({ getters }, data) {
		this._vm.$log.debug('players/addCards', data, getters, this);

		if (!data.cards) {
			throw new Error('Parameter "cards" cannot be empty!');
		}

		const cardsToAdd = _.flatten([data.cards]);
		const playerId = data.id || getters.getMyPlayer.id;
		// const cardsMerge = _.union(player.cardsInHand, cards);

		// this._vm.$log.debug('cards:union -> ', cardsMerge);

		return api.players
			.update(playerId, {
				addCards: true,
				cardsInHand: cardsToAdd,
				hasDrawnCard: true,
			})
			.then(res => {
				this._vm.$log.debug('playersApi:update()', res, this);
			})
			.catch(err => {
				this._vm.$toasted.error('This is nuts! ' + err);
				this._vm.$log.error('This is nuts! Error: ', err);
			});
	},

	create({ commit }, plObj) {
		let plData = Object.assign({}, plDefault, plObj);

		return new Promise((resolve, reject) => {
			return api.players
				.create(plData)
				.then(res => {
					commit('LOGIN', res.data, { root: true });
					commit('UPDATE', res.data);
					resolve();
				})
				.catch(err => {
					this._vm.$log.error(err);
					reject(err);
				});
		});
	},

	collectHoard({ dispatch, getters, rootGetters }, pl) {
		const myPlayer = getters.getMyPlayer;
		const hoardDeck = rootGetters['decks/getByType']('discard');
		const hoardCards = rootGetters['decks/getCardIds'](hoardDeck.id);
		const cardsInHand = _.union(myPlayer.cardsInHand, hoardCards);

		if (pl.id === myPlayer.id) {
			// Add hoard cards to player cards
			// prettier-ignore
			api.players
				.update(myPlayer.id, { cardsInHand })
				.then(async () => {
					try {
						await dispatch(
							'decks/updateById',
							{ id: hoardDeck.id, data: { cards: [] } },
							{ root: true }
						);

						dispatch(
							'game/resetAction',
							{},
							{ root: true }
						);
					} catch (err) {
						this._vm.$toasted.error(err);
						this._vm.$log.error(err);
					}
				});
		} else {
			this._vm.$toasted.info(`HOARD TAKEN BY: ${pl.name}`);
			dispatch('sound/play', 'hoard-taken');
		}
	},

	async delete({}, id) {
		const myPlayer = getters.getMyPlayer;

		try {
			await api.players.delete(myPlayer.id);
		} catch (err) {
			this._vm.$toasted.error(err);
			throw new Error(err);
		}
	},
		this._vm.$log.debug(state, payload);

		const playerId = payload.id;
		const cardIds = state[playerId].cardsInHand;

		commit('UPDATE', {
			id: playerId,
			quarrel: false,
			message: null,
		});

		return api.players.update(playerId, {
			cardsInHand: _.difference(cardIds, [payload.card.id]),
		});
	},

	/**
	 * Load player data for each player in game
	 * @param  {Array} ids            Array of player IDs
	 *
	 * @return {Object} Promise
	 */
	load({ commit }, { ids }) {
		this._vm.$log.debug('players/load', ids);

		if (ids.length) {
			return api.players
				.get(ids.join(','))
				.then(res => {
					this._vm.$log.debug('api/players/get', res);
					if (res.status === 200) {
						res.data.forEach(plData => {
							commit('UPDATE', plData);
						});
					}
				})
				.catch(err => {
					this._vm.$log.error(err);
				});
		}
	},

	nextPlayer({ dispatch, getters }) {
		const activePlayer = getters.getByProp('isActive', true);
		const activePlayerIndex = activePlayer
			? state.ids.indexOf(activePlayer.id)
			: -1;
		const nextPlayerId = getters.getNextPlayer(activePlayerIndex);

		this._vm.$log.debug(
			'nextPlayer()',
			activePlayer,
			activePlayerIndex,
			nextPlayerId
		);

		if (activePlayerIndex !== -1) {
			dispatch('update', {
				id: activePlayer.id,
				data: { isActive: false, hasDrawnCard: false },
			})
				.then(res => {
					// Merge data with existing object of player
					if (res.status === 200) {
						// this.update(res.data.id, res.data);
					}
				})
				.catch(err => {
					this.$log.error(err);
				});
		}

		return dispatch('update', {
			id: nextPlayerId,
			data: {
				isActive: true,
				hasDrawnCard: false,
			},
		});
	},

	resetCardsDrawn({ commit }, data) {
		commit('UPDATE', {
			id: data.id,
			cardsDrawnCount: 0,
			cardsDrawnIds: [],
		});
	},

	resetQuarrelWinner({ commit }, id) {
		Vue.$log.debug(id);

		return commit('UPDATE', {
			id,
			isQuarrelWinner: false,
		});
	},

	selectQuarrelCard({}, data) {
		let wsObj = {
			action: 'quarrel',
			player: data.id,
		};

		// If the player doesn't have any cards, then the 'card' property
		// won't be sent through the websocket, but we still need to send
		// a message so the game is updated properly.
		if (data.card) {
			wsObj.card = data.card;
		}

		this._vm.$socket.sendObj(wsObj);
	},

	setQuarrelWinner({ commit, dispatch }, payload) {
		commit('UPDATE', {
			id: payload.id,
			isQuarrelWinner: true,
		});

		setTimeout(() => {
			dispatch('addCards', payload);
		}, 4000);
	},

	startQuarrel({ commit, dispatch, getters, state }, options = {}) {
		const myPlayer = getters.getMyPlayer;
		const players = options.players || state.ids;

		this._vm.$log.debug(players, myPlayer);

		if (!_.includes(players, myPlayer.id)) {
			return;
		}

		dispatch('game/setQuarrelCount', players.length, { root: true });

		if (myPlayer.cardsInHand.length) {
			commit('UPDATE', {
				id: myPlayer.id,
				message: 'Choose a Card',
				quarrel: true,
			});
		} else {
			dispatch('selectQuarrelCard', { id: myPlayer.id });
		}
	},

	update({ commit }, payload) {
		this._vm.$log.debug('players/update', payload);

		return api.players.update(payload.id, payload.data);
	},
};

const mutations = {
	DRAW_CARD(state, payload) {
		this._vm.$log.debug('players/DRAW_CARD', payload, state);

		if (!state[payload.id].hasOwnProperty('cardsDrawnCount')) {
			Vue.set(state[payload.id], 'cardsDrawnCount', 0);
		}

		if (!state[payload.id].hasOwnProperty('cardsDrawnIds')) {
			Vue.set(state[payload.id], 'cardsDrawnIds', []);
		}

		state[payload.id].cardsDrawnIds.push(payload.cardDrawnId);
		state[payload.id].cardsDrawnCount += 1;

		this._vm.$log.debug(
			'cardsDrawn',
			state[payload.id].cardsDrawnIds,
			state[payload.id].cardsDrawnCount
		);
	},

	UPDATE(state, payload) {
		const playerId = payload.id;
		const $playerStorage = Vue.$storage.get('player');
		const localPlayerId = $playerStorage && $playerStorage.id;
		// const localPlayerId = state.localPlayer && state.localPlayer.id;

		this._vm.$log.debug('mutation::players/UPDATE', state, payload);

		if (playerId) {
			if (!state[playerId]) {
				Vue.set(state, playerId, {});
				state.ids.push(playerId);
			}

			for (let prop in payload) {
				Vue.set(state[playerId], prop, payload[prop]);
			}

			this._vm.$log.debug('playerMatch?', playerId, localPlayerId);

			if (playerId === localPlayerId) {
				this._vm.$storage.set('player', state[playerId]);
				// Send async websocket request for 'whoami' to update
				// cardsInHand for local player
				this._vm.$socket.sendObj({ action: 'getMyCards' });
			}
		}
	},

	UPDATE_CARDS(state, payload) {
		const id = payload.id;
		const cards = payload.cardsInHand;

		Vue.set(state[id], 'cardsInHand', cards);
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
