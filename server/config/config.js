const _ = require('lodash');
const log = require('log4js');

log.configure({
	appenders: {
		console: { type: 'console' },
	},
	categories: {
		'default': { appenders: ['console'], level: process.env.LOGLEVEL },
		'websocket': { appenders: ['console'], level: 'INFO' },
		'routes:decks': { appenders: ['console'], level: 'WARN' },
		'routes:players': { appenders: ['console'], level: 'INFO' },
	},
});

const config = {
	/* eslint quotes: "off" */
	apiError: function(err) {
		let error = err;

		if (_.isEmpty(err)) {
			error = "I'm sorry Dave, I'm afraid I can't do that.";
		}

		return {
			error,
		};
	},

	getRandom(from, to) {
		return Math.random() * (to - from) + from;
	},

	getRandomStr(num) {
		const self = this;

		return _.times(num, function() {
			return String.fromCharCode(self.getRandom(96, 122));
		}).join('')
			.replace(/`/g, ' ');
	},

	logger(name, options) {
		const mylog = log.getLogger(name || 'app');

		if (options) {
			return log.connectLogger(mylog, options);
		}

		return mylog;
	},

	mongodbUri: `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
	playerImage: 'assets/images/squirrel-placeholder.jpg',
};

module.exports = config;
