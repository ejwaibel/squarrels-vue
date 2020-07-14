import Vue from 'vue';
import {
	concat,
	find,
	filter,
	pull,
	reject,
	sampleSize,
	isArray,
} from 'lodash';

import api from '@/api/index';
import { config } from '@/config';
import store from '@/store/index';
import mutationTypes from '@/store/mutation-types';

const state = {
	isLoaded: false,
};

const getters = {
	getById: state => id => {
		return state[id];
	},

	getByType: state => name => {
		return find(state, { deckType: name });
	},

	getCardIds: state => deckId => {
		return state[deckId].cards.map(card => {
			return card.id;
		});
	},
};

const actions = {
	addCard({ getters }, payload) {
		const deck = payload.type
			? getters.getByType(payload.type)
			: getters.getById(payload.id);

		const cardsInDeck = deck.cards;

		this._vm.$log.debug(payload, deck, cardsInDeck);

		return api.decks.update(deck.id, {
			cards: concat(cardsInDeck, payload.cardId),
		});
	},

	cardsDealt({ getters }) {
		const mainDeck = getters.getByType('main');

		this._vm.$log.debug('dealPromises -> ', mainDeck);

		// After all cards have been dealt, set the starting player
		return api.decks.update(mainDeck.id, {
			cards: getters.getCardIds(mainDeck.id),
		});
	},

	async dealCards({ dispatch, getters }, playerId) {
		const drawCardOptions = { numOnly: true, isDeal: true, playerId };
		const mainDeck = getters.getByType('main');

		this._vm.$log.debug('decks/dealCards', playerId);

		// Need to reset cardsDrawn* properties so they can be
		// used again with new deal later
		await dispatch('players/resetCardsDrawn', { id: playerId }, { root: true });

		dispatch('sound/play', this._vm.$sounds.cardsShuffle, { root: true });

		return new Promise((resolve, reject) => {
			// Watch for each time a card was drawn and updated for
			// a given player, then continue to draw until they have MAX_CARDS
			const unsubscribe = store.subscribe((mutation, state) => {
				this._vm.$log.debug(
					'decks/dealCards.subscribe',
					mutation,
					state.players[playerId].cardsDrawnCount,
					state,
				);

				if (mutation.type === 'players/DRAW_CARD') {
					if (state.players[playerId].cardsDrawnCount === config.MAX_CARDS) {
						unsubscribe();

						api.players
							.update(playerId, {
								cardsInHand: state.players[playerId].cardsDrawnIds,
							})
							.then(() => {
								resolve({
									deckId: mainDeck.id,
								});
							})
							.catch(err => {
								reject(err);
							});
					} else {
						dispatch('drawCard', drawCardOptions);
					}
				}
			});

			// Trigger initial 'players/DRAW_CARD' mutation, which will trigger the .subscribe() above
			// and continue drawing cards for given user until they have MAX_CARDS
			dispatch('drawCard', drawCardOptions)
				.then(cardId => {
					this._vm.$log.debug('card drawn -> ', cardId);
				})
				.catch(err => {
					reject(err);
				});
		});
	},

	discard({ dispatch }, card) {
		return dispatch('addCard', { type: 'hoard', cardId: card.id });
	},

	drawCard({ commit, dispatch, getters }, options = {}) {
		const mainDeck = getters.getByType('main');

		this._vm.$log.debug('decks/drawCard -> ', options, mainDeck);

		dispatch('sound/play', this._vm.$sounds.drawCard, { root: true });

		const cardsFromDeck = {
			ids: getters.getCardIds(mainDeck.id),
			toDraw: options.numOnly
				? filter(mainDeck.cards, { cardType: 'number' })
				: mainDeck.cards,
		};

		const cardDrawn = options.adminCard || sampleSize(cardsFromDeck.toDraw)[0];

		this._vm.$log.debug('cardsFromDeck -> ', cardsFromDeck);
		this._vm.$log.debug('cardDrawn -> ', cardDrawn);

		// Removes cardDrawn.id from cardsFromDeck.ids
		pull(cardsFromDeck.ids, cardDrawn.id);

		// Need to update the cards in main deck so that the next
		// player doesn't draw the same card (async)
		commit(mutationTypes.decks.UPDATE_CARDS, {
			id: mainDeck.id,
			cards: reject(mainDeck.cards, c => cardDrawn.id === c.id),
		});

		// Need to update the cards drawn by the player so that
		// the subscribe knows when to stop
		if (options.isDeal) {
			commit(
				'players/DRAW_CARD',
				{
					id: options.playerId,
					cardDrawnId: cardDrawn.id,
				},
				{ root: true },
			);

			return Promise.resolve(cardDrawn);
		}

		return new Promise(resolve => {
			api.decks.update(mainDeck.id, { cards: cardsFromDeck.ids }).then(() => {
				resolve(cardDrawn);
			});
		});
	},

	load({ commit }, { ids }) {
		this._vm.$log.debug('decks/load', ids);

		if (!ids || !ids.length) {
			return Promise.reject('ERROR: No ids provided for "decks/load"');
		}

		return new Promise((resolve, reject) => {
			api.decks
				.get(ids.join(','))
				.then(res => {
					if (res.status === 200) {
						const decks = res.data;

						decks.forEach(deck => {
							commit(mutationTypes.decks.UPDATE, deck);
						});

						commit(mutationTypes.decks.LOADED);
						resolve(decks);
					} else {
						this._vm.$log.error(res);
						reject(res);
					}
				})
				.catch(err => {
					this._vm.$log.error(err);
					reject(err);
				});
		});
	},

	// eslint-disable-next-line
	remove({ }, deckIds) {
		return api.decks.delete(deckIds.join(','));
	},

	unload({ commit }) {
		commit(mutationTypes.decks.INIT);

		return Promise.resolve();
	},

	// eslint-disable-next-line
	updateById({ }, payload) {
		if (!payload.id) {
			throw new Error('Missing required "id" property.');
		}

		return new Promise((resolve, reject) => {
			api.decks
				.update(payload.id, payload.data)
				.then(res => {
					resolve(res);
				})
				.catch(res => {
					reject(res);
				});
		});
	},

	async updateByType({ getters }, payload) {
		if (!payload.type) {
			throw new Error('Missing required "type" property.');
		}

		const deck = getters.getByType(payload.type);

		try {
			return await api.decks.update(deck.id, payload.data);
		} catch (err) {
			return err;
		}
	},
};

const mutations = {
	[mutationTypes.decks.INIT](state) {
		Vue.set(state, 'isLoaded', false);

		for (const prop in state) {
			if (typeof state[prop] === 'object') {
				Vue.delete(state, prop);
			}
		}
	},

	[mutationTypes.decks.LOADED](state) {
		state.isLoaded = true;
	},

	[mutationTypes.decks.UPDATE](state, payload) {
		const deckId = payload.id;

		this._vm.$log.debug('mutation::decks/update', state, payload);

		if (!state[deckId]) {
			Vue.set(state, deckId, {});
		}

		for (const prop in payload) {
			let value = payload[prop];

			if (isArray(prop)) {
				value = [...payload[prop]];
			}

			Vue.set(state[deckId], prop, value);
		}
	},

	[mutationTypes.decks.UPDATE_CARDS](state, payload) {
		this._vm.$log.debug('decks/UPDATE_CARDS', payload);

		Vue.set(state[payload.id], 'cards', [...payload.cards]);
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
