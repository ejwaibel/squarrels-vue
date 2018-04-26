const SOUNDS_PATH = '~@/assets/sounds';
const SOUND_EFFECTS = {
	'action-card': 'action-card.mp3',
	'active-player': 'active-player.mp3',
	discard: 'discard.mp3',
	'new-player': 'new-player.mp3'
};

const state = {
	isEnabled: true,
};

const getters = {

};

const actions = {
	play({ commit }, name) {
		let audio = new Audio(SOUNDS_PATH + SOUND_EFFECTS[name]);
		audio.play();
		commit();
	},
	toggle: ({ commit }) => {
		commit('toggle');
	},
};

const mutations = {
	toggle: (state) => {
		state.isEnabled = !state.isEnabled;
	},
};

export default {
	namespaced: true,
	state,
	getters,
	actions,
	mutations,
};
