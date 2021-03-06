import Vue from 'vue';
import router from '@/routes';

import { concat, groupBy, keys, max, union, without, isEmpty } from 'lodash';

import api from '@/api/index';
import { GAME_STATUS } from '@/constants';
import mutationTypes from '@/store/mutation-types';

const newRoundState = {
	actionCard: null,
	createdBy: null,
	isDrawingCard: false,
	isLoaded: false,
	quarrelCards: {
		current: [],
		saved: [],
	},
	quarrelCount: 0,
	showQuarrel: false,
	status: GAME_STATUS.INIT,
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
		Vue.$log.debug(
			'quarrelCardByPlayer->',
			state.quarrelCards.current,
			playerId,
		);

		if (!state.quarrelCards.current.length) {
			return null;
		}

		const quarrelObj = state.quarrelCards.current.find(obj => {
			return obj.playerId === playerId;
		});

		Vue.$log.debug('playerQuarrelCard->', quarrelObj);

		if (
			!quarrelObj ||
			!Object.prototype.hasOwnProperty.call(quarrelObj, 'card')
		) {
			return null;
		}

		return quarrelObj.card;
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
	addQuarrelCard({ commit, state }, card) {
		this._vm.$log.debug(card);

		const newCards = concat(state.quarrelCards.current, card);
		const savedCards = concat(state.quarrelCards.saved, card);
		const quarrelCards = {
			current: newCards,
			saved: savedCards,
		};

		commit(mutationTypes.game.UPDATE, { quarrelCards });

		this._vm.$log.debug('addQuarrelCard', newCards, state.quarrelCount);

		// All players have selected a card
		if (newCards.length === state.quarrelCount) {
			setTimeout(() => {
				commit(mutationTypes.game.UPDATE, { showQuarrel: true });
			}, 1000);
		}
	},
	async addPlayer({ commit, dispatch, state }, { gameId, playerId }) {
		if (!playerId) {
			throw new Error('ERROR: Missing "playerId" parameter');
		}

		const newPlayers = union(playerId, [...state.playerIds, playerId]);

		this._vm.$log.debug('game/addPlayer', gameId, playerId, newPlayers);

		if (!newPlayers.length) {
			throw new Error('ERROR: NO PLAYERS TO ADD');
		}

		const data = await api.games.updatePlayers(gameId, newPlayers);

		commit(mutationTypes.game.UPDATE, data);

		await dispatch(
			'players/updateGame',
			{
				id: playerId,
				gameId,
			},
			{ root: true },
		);
	},

	async load({ commit }, { id }) {
		Vue.$log.debug('game/load', id);

		try {
			const data = await api.games.get(id);
			const gameData = data[0];

			commit(mutationTypes.game.UPDATE, gameData);
			commit(mutationTypes.game.LOADED);

			// await dispatch('decks/load', { ids: gameData.deckIds }, { root: true });

			return gameData;
		} catch (err) {
			this._vm.$log.error(err);
			router.push('/');
		}
	},

	nextRound({ state }) {
		this._vm.$log.debug('game/nextRound');

		try {
			return api.games.nextRound(state.id);
		} catch (err) {
			this._vm.$log.error(err);
			throw new Error(err);
		}
	},

	async quarrelEnded({ dispatch }) {
		this._vm.$log.debug('quarrelEnded');

		try {
			await dispatch('resetAction');
			await dispatch('players/resetQuarrel', {}, { root: true });
		} catch (e) {
			this._vm.$log.error(e);
			throw new Error(e);
		}
	},

	async quarrelWinner({ commit, dispatch, state }) {
		if (!state.quarrelCards.current.length) {
			try {
				await dispatch('resetAction');
			} catch (err) {
				throw new Error(err);
			}
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

		this._vm.$log.debug('quarrelWinner -> ', quarrelGroup, winners);

		if (winners.length === 1) {
			const cards = state.quarrelCards.saved.map(obj => {
				return obj.card;
			});
			const winner = winners[0].playerId;

			this._vm.$log.debug('cards -> ', cards);
			this._vm.$log.debug('winner -> ', winner);

			// Wait until cards are shown to display winner
			// prettier-ignore
			try {
				await dispatch(
					'players/setQuarrelWinner',
					{
						id: winner,
						cards,
					},
					{ root: true },
				);
			} catch (err) {
				throw new Error(err);
			}
		} else {
			// const players = map(winners, obj => obj.playerId);
			const players = winners;

			this._vm.$log.debug('quarrel TIE -> ', players);

			setTimeout(() => {
				// Reset current quarrelCards
				commit(mutationTypes.game.UPDATE, {
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

	reset({ state }) {
		try {
			return api.games.reset(state.id);
		} catch (err) {
			this._vm.$log.error(err);
			throw new Error(err);
		}
	},

	async resetAction({ state }) {
		this._vm.$log.debug('game/resetAction -> ', state);

		try {
			await api.games.actionCard(state.id, null);
		} catch (err) {
			this._vm.$toasted.error(err);
			throw new Error(err);
		}
	},

	async createDecks({ dispatch, state }) {
		this._vm.$log.debug('game/createDecks -> ', state);

		try {
			// Returns after all decks have been initialized
			const data = await api.games.createDecks(state.id);
			const ids = data.deckIds;

			try {
				await api.games.update(state.id, { status: GAME_STATUS.SHUFFLE });
				await dispatch('decks/load', { ids }, { root: true });
			} catch (err) {
				if (ids.length) {
					await dispatch('decks/remove', { ids }, { root: true });
				}

				this._vm.$log.error(err);
				throw new Error(err);
			}

			return data;
		} catch (err) {
			throw new Error(err);
		}
	},

	async start({ dispatch, state }) {
		this._vm.$log.debug('game/start', state);

		try {
			await api.games.update(state.id, { status: GAME_STATUS.DEALING });

			try {
				await dispatch('decks/dealCards', state.playerIds, { root: true });
			} catch (err) {
				this._vm.$log.error(err);
				throw new Error(err);
			}

			// All players and decks have been updated, game can start
			await api.games.start(state.id);
			await dispatch('players/nextPlayer', null, { root: true });
		} catch (err) {
			await api.games.update(state.id, { status: GAME_STATUS.SHUFFLE });
			this._vm.$log.error(err);
			throw new Error(err);
		}
	},

	setQuarrelCount({ commit }, count) {
		commit(mutationTypes.game.UPDATE, { quarrelCount: count });
	},

	/**
	 * Unload the current local game state, this will
	 * only affect current player. Since the player is
	 * being removed, we need to add their cards back into
	 * the main deck.
	 *
	 * @returns {Object} 	Promise
	 */
	async unload({ commit, dispatch, state, rootState }) {
		const playerIds = state.playerIds;
		const updatedPlayerIds = without(playerIds, rootState.localPlayer.id);

		try {
			await api.games.updatePlayers(state.id, updatedPlayerIds);
			await dispatch(
				'players/updateGame',
				{
					id: rootState.localPlayer.id,
					gameId: null,
				},
				{ root: true },
			);

			commit(mutationTypes.game.INIT);
		} catch (err) {
			this._vm.$log.error(err);
			throw new Error(err);
		}
	},

	// eslint-disable-next-line
  update({}, data) {
		return api.games.update(state.id, data);
	},
};

const mutations = {
	[mutationTypes.game.INIT](state) {
		for (const prop in initialState) {
			Vue.set(state, prop, initialState[prop]);
		}

		Vue.set(state, 'isLoaded', false);
	},

	[mutationTypes.game.LOADED](state) {
		state.isLoaded = true;
	},

	[mutationTypes.game.UPDATE](state, payload) {
		Vue.$log.debug('mutation::game/update', state, payload);

		if (isEmpty(payload)) {
			Vue.$log.warn('Empty payload for "UPDATE"!');
		}

		const prevPlayerCount = state.playerIds.length;

		for (const prop in payload) {
			if (Object.prototype.hasOwnProperty.call(state, prop)) {
				if (Array.isArray(state[prop])) {
					state[prop] = [...payload[prop]];
				} else {
					Vue.set(state, prop, payload[prop]);
				}

				if (prop === 'playerIds') {
					const newPlayerCount = payload[prop].length;
					const countDiff = newPlayerCount - prevPlayerCount;

					if (countDiff !== 0) {
						const msg = 'Player ' + (countDiff > 0 ? 'joined' : 'left') + '!';

						this._vm.$toasted.info(msg, { duration: 500 });
					}
				}
			}
		}

		// Reset quarrel data for all players when game is updated with null actionCard
		if (!state.actionCard && state.quarrelCards) {
			state.showQuarrel = false;
			state.quarrelCount = 0;
			Vue.set(state.quarrelCards, 'current', []);
			Vue.set(state.quarrelCards, 'saved', []);
		}

		state.startDate = state.updatedAt;
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
