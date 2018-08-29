<template>
	<div
		class="deck"
		:class="{
			'empty': !numCards,
		}"
	>
		<div
			class="cards-group"
			:class="{ disabled: isDisabled }"
			role="button"
			v-show="numCards"
			@click.prevent="onClick"
		>
			<transition-group tag="div" class="transition" name="cards-hoard">
				<div
					v-for="(card, index) in numCards"
					:key="index"
					class="btn-card card blank--"
				>
				</div>
			</transition-group>
		</div>
	</div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
	name: 'DeckHoard',
	props: {
		cards: {
			type: Array,
			required: true,
		},
		numCards: {
			type: Number,
			required: true,
		},
	},
	data: function() {
		return {
			maxClicks: 4,
			tooManyClicks: false,
		};
	},
	mounted: function() {
		// this.$store.dispatch('decks/load', this.id);
	},
	computed: {
		...mapGetters({
			canDrawCard: 'players/canDrawCard',
			myPlayer: 'players/getMyPlayer',
		}),
		...mapState({
			actionCard: state => state.game.actionCard,
		}),
		canHoard: function() {
			if (!this.actionCard) {
				return false;
			}

			return !this.myPlayer.isActive && this.actionCard.name === 'hoard';
		},
		isDisabled: function() {
			return this.tooManyClicks || !this.actionCard;
		},
	},
	methods: {
		collectHoard: function() {
			if (this.canHoard) {
				this.$socket.sendObj({
					action: 'hoard',
					player: this.myPlayer,
				});

				return true;
			}

			if (this.myPlayer.cardsInHand.length) {
				this.$store.dispatch('players/removeHighCard', this.myPlayer);
			}
		},
		onClick: function() {
			if (this.actionCard) {
				this.collectHoard();
			} else {
				if (this.maxClicks >= 0) {
					this.$toasted.info(
						`STOP THAT! Only ${this.maxClicks} clicks LEFT!`
					);
					this.maxClicks--;
				} else {
					this.$toasted.error(
						'You have been banned from collecting the Hoard!'
					);
					this.tooManyClicks = true;
				}
			}
		},
	},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
// prettier-ignore
@import "~@/assets/scss/variables";
// prettier-ignore
@import "~@/../node_modules/bootstrap/scss/mixins/breakpoints";

.card {
	top: 0;

	@for $i from 1 through 30 {
		$rotate: random(30) - 15;
		$left: random(30) - 15;
		$top: random(20) - 10;

		&:nth-child(#{$i}) {
			transform: translate(#{$left}px, #{$top}px) rotate(#{$rotate}deg);
		}
	}
}

.cards-hoard-enter-active,
.cards-hoard-leave-active {
	position: absolute;
	transition-duration: 0.75s;
	transition-property: opacity, transform;
}

.cards-hoard-enter {
	opacity: 0;
	transform: scale(3);
}

.cards-hoard-enter-to,
.cards-hoard-leave {
	opacity: 1;
	transform: scale(1);
}

.cards-hoard-leave-to {
	opacity: 0;
	transform: scale(3);
}
</style>