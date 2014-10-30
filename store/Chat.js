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
			selected: '',
			channels: {},
			nick: '',
		});

		this.listenTo(ServerStore, this.updateChannels, this.updateChannels);
	},
	getDefaultData: function(){
		return {
			logs: this.logs,
			users: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].users : null),
			topic: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].topic : null),
			selected: this.selected,
		}
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. when Nightwatch gives you a month worth of backlog).
	triggerSync: _.throttle(function(){
		this.trigger(this.getDefaultData());
	}, 100),

	updateChannels: function(data){
		this.nick = data.nick;
		this.channels = data.channels;
		// Drop logs for closed channels and add empty logs for new ones.
		for(var i in this.logs){
			if (i[0] === '#' && !data.channels[i.slice(1)] && i !== '##battleroom')
				delete this.logs[i];
		}
		for(var i in data.channels){
			if (!this.logs['#'+i]){
				this.logs['#'+i] = this.emptyLog();
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

	emptyLog: function(){
		return {
			messages: [], // message list
			unread: 0, // number of unread messages
			needAttention: false, // true if we were mentioned/ringed
		};
	},

	addEntry: function(log, entry){
		if (!this.logs[log])
			this.logs[log] = this.emptyLog();

		if (log !== this.selected){
			this.logs[log].unread++;
			if (log[0] !== '#' || new RegExp(this.nick.replace('[', '\\[').replace(']', '\\]'), 'i').exec(entry.message))
				this.logs[log].needAttention = true;
		}

		this.logs[log].messages.push(entry);
		this.triggerSync();
	},

	MsgType: {
		NORMAL: 0,
		ME: 1,
		SYSTEM: 2,
	},

	// Action listeners.
	
	selectLogSource: function(source){
		this.logs[this.selected].unread = 0;
		if (source in this.logs){
			this.selected = source;
		} else {
			this.autoSelect();
		}
		this.logs[this.selected].needAttention = false;
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
	sayPrivate: function(user, message){
		this.addEntry(user, {
			id: _.uniqueId('e'),
			author: this.nick,
			message: message,
			date: new Date(),
			type: this.MsgType.NORMAL
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
	openPrivate: function(user){
		if (!this.logs[user])
			this.logs[user] = this.emptyLog();
		this.selectLogSource(user);
	},
	closePrivate: function(user){
		delete this.logs[user];
		this.autoSelect();
		this.triggerSync();
	},
});
