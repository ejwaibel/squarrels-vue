import Vue from 'vue';
import router from '@/router';

import { concat, groupBy, keys, map, max, union, without } from 'lodash';

import api from '@/api/index';

const newRoundState = {
	actionCard: null,
	isDealing: false,
	isLoaded: false,
	isStarted: false,
	quarrelCards: {
		current: [],
		saved: [],
	},
	quarrelCount: 0,
	showQuarrel: false,
};

const initialState = Object.assign({}, newRoundState, {
	deckIds: [],
	id: null,
	playerIds: [],
	startDate: null,
	roundNumber: 1,
	updatedAt: null,
});

const state = Object.assign({}, initialState);

const getters = {
	getQuarrelCardByPlayer: state => playerId => {
		Vue.$log.debug('quarrelCardByPlayer->', state.quarrelCards.current, playerId);

		const quarrelObj = find(state.quarrelCards.current, obj => {
			return obj.playerId === playerId;
		});

		Vue.$log.debug('playerQuarrelCard->', quarrelObj);

		if (quarrelObj) {
			return quarrelObj.card;
		}

		return null;
	},
	isActionCard: state => (name = '') => {
		Vue.$log.debug('isActionCard->', state, name);

		const action = state.actionCard;

		if (!name) {
			return action !== null;
		}

		return action && action.name === name;
	},

	isPlayerInGame: state => id => {
		Vue.$log.debug('isPlayerInGame->', state, id);

		return state.playerIds.filter(pl => pl.id === id).length;
	},
};

const actions = {
	async actionCard({ state }, actionCard) {
		Vue.$log.debug('game/actionCard->', actionCard, state);

		try {
			const res = await api.games.actionCard(state.id, actionCard.id);

			Vue.$log.debug('gameUpdate:actionCard -> ', res);

			return res;
		} catch (err) {
			return err;
		}
	},
	addQuarrelCard({ commit, dispatch, state }, card) {
		this._vm.$log.debug(card);

		const newCards = concat(state.quarrelCards.current, card);
		const savedCards = concat(state.quarrelCards.saved, card);
		const quarrelCards = {
			current: newCards,
			saved: savedCards,
		};

		commit('UPDATE', { quarrelCards });

		this._vm.$log.debug('addQuarrelCard', newCards, state.quarrelCount);

		// All players have selected a card
		if (newCards.length === state.quarrelCount) {
			dispatch('quarrelWinner');
		}
	},
	async addPlayer({ commit, dispatch, state }, { gameId, playerId }) {
		const newPlayers = union(playerId, [...state.playerIds, playerId]);

		Vue.$log.debug('game/addPlayer', gameId, playerId, newPlayers);

		if (!playerId) {
			return Promise.reject('ERROR: Missing "playerId" parameter');
		}

		if (newPlayers.length) {
			const res = await api.games.updatePlayers(gameId, newPlayers);

			Vue.$log.debug('updatePlayers()', res);
			const gameData = res.data;

			commit('UPDATE', gameData);

			await dispatch(
				'players/updateGame',
				{
					id: playerId,
					gameId,
				},
				{ root: true }
			);

			return Promise.resolve(gameData);
		}

		return Promise.reject('NO PLAYERS TO ADD');
	},

	load({ commit, dispatch }, { id }) {
		return new Promise((resolve, reject) => {
			api.games
				.get(id)
				.then(res => {
					Vue.$log.debug('game/load', res);

					if (res.status === 200) {
						const gameData = res.data[0],
							// deckIds = gameData.deckIds,
							playersInGame = gameData.playerIds;

						commit('UPDATE', gameData);
						commit('LOADED');

						resolve(gameData);

						// Add all players to the current state of game
						if (playersInGame.length) {
							dispatch('players/add', playersInGame, {
								root: true,
							});
						}
					} else {
						router.push('/');
					}
				})
				.catch(err => {
					this._vm.$log.error(err);
					reject(err);
				});
		});
	},

	async nextRound({ dispatch, state }) {
		this._vm.$log.debug('game/nextRound');

		await dispatch('decks/unload', {}, { root: true });

		return api.games.nextRound(state.id);
	},

	quarrelWinner({ commit, dispatch, state }) {
		if (!state.quarrelCards.current.length) {
			dispatch('resetAction');

			return false;
		}

		const quarrelGroup = groupBy(state.quarrelCards.current, data => {
			// User had no cards, so the card property will be 'null'
			if (!data.card) {
				return -1;
			}

			return data.card.name === 'golden' ? 6 : data.card.amount;
		});
		const winningCard = max(keys(quarrelGroup));
		const winners = quarrelGroup[winningCard];

		this._vm.$log.debug(quarrelGroup, winners);

		commit('UPDATE', { showQuarrel: true });

		if (winners.length === 1) {
			const cards = map(state.quarrelCards.saved, obj => {
				return obj.card;
			});

			const winner = winners[0].playerId;

			this._vm.$log.debug('cards -> ', cards);

			// Wait until cards are shown to display winner
			setTimeout(() => {
				dispatch(
					'players/setQuarrelWinner',
					{
						id: winner,
						cards,
					},
					{ root: true }
				);

				// Wait some time after winner has been set before resetting
				setTimeout(() => {
					commit('UPDATE', {
						showQuarrel: false,
						quarrelCards: { current: [], saved: [] },
					});

					dispatch('players/resetQuarrelWinner', { id: winner }, { root: true });

					dispatch('resetAction');
				}, 1000);
			}, 3500);
		} else {
			const players = map(winners, obj => obj.playerId);

			setTimeout(() => {
				// Reset current quarrelCards
				commit('UPDATE', {
					quarrelCards: {
						current: [],
						saved: state.quarrelCards.saved,
					},
					showQuarrel: false,
				});

				dispatch('players/startQuarrel', { players }, { root: true });
			}, 4000);
		}
	},

	async reset({ dispatch, state }) {
		try {
			await dispatch('decks/unload', {}, { root: true });

			return api.games.reset(state.id);
		} catch (err) {
			throw new Error(err);
		}
	},

	async resetAction({ dispatch }) {
		try {
			// Add current action card to the 'discard' deck
			await dispatch(
				'decks/addCard',
				{ type: 'discard', cardId: state.actionCard.id },
				{ root: true }
			);

			return await api.games.actionCard(state.id, null);
		} catch (err) {
			this._vm.$toasted.error(err);
		}
	},

	start({ commit, dispatch, rootGetters, state }) {
		const dealPromises = [];

		this._vm.$log.debug('game/start', state);

		commit('START_DEAL');

		return api.games
			.dealCards(state.id, state.playerIds)
			.then(() => {
				// Load all deck data into the store
				return dispatch('decks/load', { ids: state.deckIds }, { root: true });
			})
			.then(() => {
				// Loop through each player and deal cards
				// Each deal will be saved as a Promise so we can wait
				// for all players to be dealt cards before starting game
				for (const playerId of state.playerIds) {
					dealPromises.push(
						// prettier-ignore
						dispatch(
							'decks/dealCards',
							playerId,
							{ root: true }
						)
					);
				}

				// prettier-ignore
				Promise.all(dealPromises)
					.then(() => {
						const mainDeck = rootGetters['decks/getByType']('main');

						this._vm.$log.debug('dealPromises -> ', mainDeck);

						// After all cards have been dealt, set the starting player
						api.decks
							.update(mainDeck.id, { cards: rootGetters['decks/getCardIds'](mainDeck.id) })
							.then(() => {
								// All players and decks have been updated, game can start
								commit('END_DEAL');
								api.games.start(state.id);
								dispatch('players/nextPlayer', null, { root: true });
							});
					})
					.catch(err => {
						this._vm.$log.error(err);
						this._vm.$toasted.error(
							`Problem dealing cards: ${err}`
						);
					});
			})
			.catch(err => {
				this._vm.$log.error(err);
			});
	},

	setQuarrelCount({ commit }, count) {
		commit('UPDATE', { quarrelCount: count });
	},

	/**
	 * Unload the current local game state, this will
	 * only affect current player. Since the player is
	 * being removed, we need to add their cards back into
	 * the main deck.
	 *
	 * @returns {Object} 	Promise
	 */
	unload({ commit, dispatch, state, rootState }) {
		const playerIds = state.playerIds;
		const updatedPlayerIds = without(playerIds, rootState.localPlayer.id);

		return api.games
			.updatePlayers(state.id, updatedPlayerIds)
			.then(async() => {
				await dispatch(
					'players/updateGame',
					{
						id: rootState.localPlayer.id,
						gameId: null,
					},
					{ root: true }
				);

				commit('INIT');
			})
			.catch(err => {
				this._vm.$log.error(err);
			});
	},

	// eslint-disable-next-line
	update({}, data) {
		return api.games.update(state.id, data);
	},
};

const mutations = {
	LOADED(state) {
		state.isLoaded = true;
	},

	INIT(state) {
		for (const prop in initialState) {
			Vue.set(state, prop, initialState[prop]);
		}

		Vue.set(state, 'isLoaded', false);
	},

	END_DEAL(state) {
		state.isDealing = false;
	},

	START_DEAL(state) {
		state.isDealing = true;
	},

	UPDATE(state, payload) {
		const prevPlayerCount = state.playerIds.length;

		Vue.$log.debug('mutation::game/update', state, payload);

		if (payload) {
			for (const prop in payload) {
				if (state.hasOwnProperty(prop)) {
					if (Array.isArray(state[prop])) {
						state[prop] = [...payload[prop]];
					} else {
						Vue.set(state, prop, payload[prop]);
					}

					if (prop === 'playerIds' && prevPlayerCount > 0) {
						const newPlayerCount = payload[prop].length;
						const countDiff = newPlayerCount - prevPlayerCount;

						if (countDiff !== 0) {
							const msg = 'Player ' + (countDiff > 0 ? 'joined' : 'left') + '!';

							this._vm.$toasted.info(msg, { duration: 500 });
						}
					}
				}
			}

			state.startDate = state.updatedAt;
		}
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
