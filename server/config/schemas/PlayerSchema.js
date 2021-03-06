const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
	cardsInHand: {
		type: [Schema.Types.ObjectId],
		ref: 'Card',
		select: false,
	},
	cardsInStorage: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Card',
		},
	],
	gameId: {
		type: Schema.Types.ObjectId,
		ref: 'Game',
		default: null,
	},
	hasStoredCards: {
		type: Boolean,
		default: false,
	},
	hasDrawnCard: {
		type: Boolean,
		default: false,
	},
	selectQuarrelCard: {
		type: Boolean,
		default: false,
	},
	img: {
		type: String,
	},
	isActive: {
		type: Boolean,
		default: false,
	},
	isQuarrelWinner: {
		type: Boolean,
		default: false,
	},
	name: {
		type: String,
		required: true,
		trim: true,
	},
	score: {
		type: Number,
		default: 0,
	},
	sessionId: {
		type: String,
		required: true,
		select: false,
	},
	totalCards: {
		type: Number,
		default: 0,
	},
},
{
	collection: 'players',
	timestamps: true,
	toObject: {
		virtuals: true,
	},
	toJSON: {
		virtuals: true,
	},
});
