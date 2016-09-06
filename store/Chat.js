/*
 * Stores the current selected channel/private convo, maintains chat history,
 * manages alerts when you're highlighted in chat.
 *
 * The logs object's keys are named '#channel' for channels,
 * plain 'UserName' for private messages and the special
 * channel '##battleroom' for battleroom logs.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');
var SystemInfo = require('util/SystemInfo.js');
var Sound = require('act/Sound.js');

var MsgType = {
	NORMAL: 0,
	ME: 1,
	SYSTEM: 2,
};

module.exports = function(lobbyServer, processStore){ return Reflux.createStore({
	
	listenables: require('act/Chat.js'),

	init: function(){
		_.extend(this, {
			logs: {},
			selected: '',
			channels: {},
			channelSubs: {},
			nick: '',
			lastLogDate: {},
		});

		this.listenTo(lobbyServer, this.updateChannels, this.updateChannels);
		this.createLog('##battleroom');
	},
	getInitialState: function(){
		return {
			logs: this.logs,
			users: ((this.selected[0] === '#' && this.channels[this.selected.slice(1)]) ? this.channels[this.selected.slice(1)].users : null),
			topic: ((this.selected[0] === '#' && this.channels[this.selected.slice(1)]) ? this.channels[this.selected.slice(1)].topic : null),
			channelSubs: this.channelSubs,
			selected: this.selected,
		}
	},

	// We throttle this to avoid slowdowns due to excessive retriggering
	// (e.g. when Nightwatch gives you a month worth of backlog).
	triggerSync: _.throttle(function(){
		this.trigger(this.getInitialState());
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
				this.createLog('#'+i);
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

	createLog: function(name){
		// The log format is
		//     [9:46:48 PM] <user> This is my message.
		// for multiline messages every line except the first is prefixed with \t.
		var entryRegex = /(([^\n]|\n\t)+)\n?/g;
		var fileLog = Applet && Applet.readFileLess(SystemInfo.springHome +
			'/weblobby/logs/' + name + '.txt', 250) || '';
		var messages = [];
		var entryMatch;
		while ((entryMatch = entryRegex.exec(fileLog))) {
			var match;
			if ( (match = entryMatch[1].
					match(/^\[(\d+):(\d+):(\d+)([^\]]*)\] (<([^>]+)>|\*) ([\s\S]*)/)) ) {
				var time = new Date(0);
				time.setHours(match[4] === ' PM' ? parseInt(match[1]) + 12 : match[1]);
				time.setMinutes(match[2]);
				time.setSeconds(match[3]);
				var message = match[6] ? match[7] : match[7].split(' ').slice(1).join(' ');
				messages.push({
					id: _.uniqueId('e'),
					author: match[6] || match[7].split(' ')[0],
					message: message.replace(/\n\t/g, '\n'),
					date: time,
					type: match[6] ? MsgType.NORMAL : MsgType.ME,
				});
			} else {
				// TODO: Replace this hack with a new message type.
				messages.push({
					id: _.uniqueId('e'),
					author: '',
					message: entryMatch[1],
					date: new Date(),
					type: MsgType.NORMAL,
				});
			}
		}
		this.logs[name] = {
			messages: messages,
			unread: 0, // number of unread messages
			needAttention: false, // true if we were mentioned/ringed
		};
	},

	addEntry: function(log, entry){
		if (!this.logs[log])
			this.createLog(log);

		if (log !== this.selected){
			if (log[0] !== '#' || new RegExp(this.nick.replace('[', '\\[').
					replace(']', '\\]'), 'i').exec(entry.message)) {
				this.logs[log].needAttention = true;
				// We don't need to react to changes in the store so we
				// don't have to listen to it.
				if (log !== '##battleroom' || !processStore.springRunning)
					Sound.playRing();
			}
		}

		if (log !== this.selected || this.logs[log].unread > 0)
			this.logs[log].unread++;

		if (Applet) {
			var logFile = SystemInfo.springHome + '/weblobby/logs/' + log + '.txt';

			// Insert the current date on startup and every six hours afterwards.
			// This allows you to tell the date of messages without putting
			// the full date in each individual timestamp.
			if (!this.lastLogDate[log] || (entry.date - this.lastLogDate[log]) / (1000 * 60 * 60) > 6) {
				this.lastLogDate[log] = entry.date;
				Applet.writeToFile(logFile, '*** ' + entry.date.toLocaleString());
			}

			var dateStr = '[' + entry.date.toLocaleTimeString().
				replace(/ [A-Z][A-Z][A-Z].*$/, '') + ']'; // strip timezone
			var logLine;
			var message = entry.message.replace(/\n/g, '\n\t');
			if (entry.type === MsgType.NORMAL)
				logLine = dateStr + ' <' + entry.author + '> ' + message;
			else if (entry.type === MsgType.ME)
				logLine = dateStr + ' * ' + entry.author + ' ' + message;
			Applet.writeToFile(logFile, logLine);
		}

		// TODO: This should be replaced with lazy rendering chat from
		// lazy-chat branch, presumably after a switch to Chromium Embedded
		// Framework since it causes flicker on QtWebKit.
		if (this.logs[log].messages.length >= 250)
			this.logs[log].messages.shift();

		this.logs[log].messages.push(entry);
		this.triggerSync();
	},

	// Action listeners.
	
	selectLogSource: function(source){
		if (this.selected in this.logs)
			this.logs[this.selected].unread = 0;

		if (source in this.logs)
			this.selected = source;
		else
			this.autoSelect();

		this.logs[this.selected].needAttention = false;
		this.triggerSync();
	},
	saidChannel: function(channel, user, message, me, timestamp){
		this.addEntry('#' + channel, {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: timestamp || new Date(),
			type: me ? MsgType.ME : MsgType.NORMAL
		});
	},
	sentPrivate: function(user, message, me){
		if (user === 'Nightwatch' && !(user in this.logs))
			return;
		this.addEntry(user, {
			id: _.uniqueId('e'),
			author: this.nick,
			message: message,
			date: new Date(),
			type: me ? MsgType.ME : MsgType.NORMAL
		});
	},
	saidPrivate: function(user, message, me, timestamp){
		if (user === 'Nightwatch' && !(user in this.logs))
			return;
		this.addEntry(user, {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: timestamp || new Date(),
			type: me ? MsgType.ME : MsgType.NORMAL
		});
	},
	saidBattle: function(user, message, me){
		this.addEntry('##battleroom', {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: me ? MsgType.ME : MsgType.NORMAL
		});
	},
	openPrivate: function(user){
		if (!this.logs[user])
			this.createLog(user);
		this.selectLogSource(user);
	},
	closePrivate: function(user){
		delete this.logs[user];
		this.autoSelect();
		this.triggerSync();
	},
	subscribedToChannel: function(channel, subscribed){
		if (subscribed)
			this.channelSubs[channel] = true;
		else
			delete this.channelSubs[channel];
		this.triggerSync();
	},
})};

module.exports.MsgType = MsgType;
