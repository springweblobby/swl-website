/*
 * Stores the currest selected channel/private convo, maintains chat history,
 * manages alerts when you're highlighted in chat.
 *
 * The logs object's keys are named '#channel' for channels,
 * plain 'UserName' for private messages and the special
 * channel '##battleroom' for battleroom logs.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var ServerStore = require('./LobbyServer.js');

module.exports = Reflux.createStore({
	
	listenables: require('../act/Chat.js'),

	init: function(){
		_.extend(this, {
			logs: {},
			// Channels/private chats that have new messages, especially if our nick is mentioned.
			needAttention: {},
			selected: '',
			channels: {},
		});

		this.listenTo(ServerStore, this.updateChannels, this.updateChannels);
	},
	getDefaultData: function(){
		return {
			logs: this.logs,
			users: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].users : null),
			topic: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].topic : null),
			needAttention: this.needAttention,
			selected: this.selected,
		}
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. when Nightwatch gives you a month worth of backlog).
	triggerSync: _.throttle(function(){
		this.trigger(this.getDefaultData());
	}, 100),

	updateChannels: function(data){
		this.channels = data.channels;
		// Drop logs for closed channels and add empty logs for new ones.
		for(var i in this.logs){
			if (!data.channels[i.slice(1)])
				delete this.logs[i];
		}
		for(var i in data.channels){
			if (!this.logs['#'+i]){
				this.logs['#'+i] = [];
				this.selected = '#'+i;
			}
		}

		this.autoSelect();
		this.triggerSync();
	},

	// Try to select a valid tab if the current tab closed.
	autoSelect: function(){
		if (!this.logs[this.selected])
			this.selected = _.keys(this.logs)[0] || '';
	},

	addEntry: function(log, entry){
		if (!(log in this.logs))
			this.logs[log] = [];

		if (!(log in this.needAttention)){
			this.logs[log].push({
				id: _.uniqueId('e'),
				type: this.MsgType.NEW_CUTOFF,
			});
		}
		this.logs[log].push(entry);
		this.triggerSync();
	},

	MsgType: {
		NORMAL: 0,
		ME: 1,
		SYSTEM: 2,
		NEW_CUTOFF: 3, // a cutoff point where unread messages begin
	},

	// Action listeners.
	
	selectLogSource: function(source){
		if (source in this.logs)
			this.selected = source;
		else
			this.autoSelect();
		this.triggerSync();
	},
	saidChannel: function(channel, user, message, me){
		this.addEntry('#' + channel, {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
		});
	},
	saidPrivate: function(user, message){
		this.addEntry(user, {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: this.MsgType.NORMAL
		});
	},
	saidBattle: function(){
		this.triggerSync();
	},
});
