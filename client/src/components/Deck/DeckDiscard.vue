<template>
	<div
		:class="{
			empty: totalCards === 0,
		}"
		class="deck disabled"
	>
		<transition-group
			v-show="totalCards !== 0"
			tag="div"
			class="cards-group disabled"
			name="cards-discard"
		>
			<div
				v-for="card in cards"
				:key="card.id"
				:class="`action--${card.name}`"
				class="btn-card card"
			></div>
		</transition-group>
	</div>
</template>

<script>
export default {
	name: 'deck-discard',
	props: {
		cards: {
			type: Array,
			required: true,
		},
	},
	computed: {
		totalCards() {
			return this.cards.length;
		},
	},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.card {
	top: 0;

	@for $i from 1 through 30 {
		$rotate: random(30) - 15;
		$left: random(30) - 15;
		$top: random(20) - 10;

		&:nth-child(#{$i}) {
			transform: rotate(#{$rotate}deg);
			left: #{$left}px;
			top: #{$top}px;
		}
	}
}

.cards-discard-enter-active,
.cards-discard-leave-active {
	position: absolute;
	transition-duration: 0.75s;
	transition-property: opacity, transform;
}

.cards-discard-enter {
	opacity: 0;
	transform: scale(3);
}

.cards-discard-enter-to,
.cards-discard-leave {
	opacity: 1;
	transform: scale(1);
}

.cards-discard-leave-to {
	opacity: 0;
	transform: scale(3);
}
</style>
