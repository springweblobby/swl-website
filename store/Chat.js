/*
 * Stores and updates chat history.
 *
 * The logs object's keys are named '#channel' for channels,
 * plain 'UserName' for private messages and the special
 * channel '##battleroom' for battleroom logs.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');

module.exports = Reflux.createStore({
	
	listenables: require('../act/Chat.js'),

	init: function(){
		this.logs = {};

		this.logs['#asdf'] = [];
		for(var i = 0; i < 200; i++){
			this.logs['#asdf'].push({
				id: _.uniqueId('e'),
				author: _.sample(['Failer', 'Skasi', 'Orfailius', 'emmanuel', 'qicasso', 'Licho']),
				message: _.sample(['hi', 'blasphemy!!', 'how you doing', 'fine', 'springie is broken!', 'nerf crusher', 'crusher OP', 'HONK', 'ye', 'wat', 'wtf', 'QQ', 'ZK is ded', 'so ded', 'dead yet?', 'wub wub', 'lol']),
				date: new Date(),
				type: _.random(10) === 0 ? this.MsgType.ME : this.MsgType.NORMAL
			});
		}
	},
	getDefaultData: function(){
		return this.logs;
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. when Nightwatch gives you a month worth of backlog).
	triggerSync: _.throttle(function(){
		this.trigger(this.logs);
	}, 100),

	MsgType: {
		NORMAL: 0,
		ME: 1,
		SYSTEM: 2,
	},

	// Action listeners.
	
	saidChannel: function(channel, user, message, me){
		var chan = '#' + channel;
		if (!(chan in this.logs))
			this.logs[chan] = [];
		this.logs[chan].push({
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
		});
		this.triggerSync();
	},
	saidPrivate: function(user, message){
		if (!(user in this.logs))
			this.logs[user] = [];
		this.logs[user].push({
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: this.MsgType.NORMAL
		});
		this.triggerSync();
	},
	saidBattle: function(){
		this.triggerSync();
	},

	// Not action listeners.
});
