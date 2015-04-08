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

module.exports = Reflux.createStore({
	
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

		this.listenTo(require('store/LobbyServer.js'), this.updateChannels, this.updateChannels);
	},
	getInitialState: function(){
		return {
			logs: this.logs,
			users: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].users : null),
			topic: (this.selected[0] === '#' ? this.channels[this.selected.slice(1)].topic : null),
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
		this.logs[name] = {
			messages: Applet && Applet.readFileLess(SystemInfo.springHome +
				'/weblobby/logs/' + name + '.txt', 70).split('\n').filter(function(line){
					return line !== '';
				}).map(function(line){

				var match;
				if ( (match = line.match(/^\[(\d+):(\d+):(\d+)([^\]]*)\] (<([^>]+)>|\*) (.*)/)) ) {
					var time = new Date(0);
					time.setHours(match[4] === ' PM' ? parseInt(match[1]) + 12 : match[1]);
					time.setMinutes(match[2]);
					time.setSeconds(match[3]);
					return {
						id: _.uniqueId('e'),
						author: match[6] || match[7].split(' ')[0],
						message: match[6] ? match[7] : match[7].split(' ').slice(1).join(' '),
						date: time,
						type: match[6] ? this.MsgType.NORMAL : this.MsgType.ME,
					};
				} else {
					// TODO: Replace this hack with a new message type.
					return {
						id: _.uniqueId('e'),
						author: '',
						message: line,
						date: new Date(),
						type: this.MsgType.NORMAL,
					};
				}
			}.bind(this)) || [],
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
			if (entry.type === this.MsgType.NORMAL)
				logLine = dateStr + ' <' + entry.author + '> ' + entry.message;
			else if (entry.type === this.MsgType.ME)
				logLine = dateStr + ' * ' + entry.author + ' ' + entry.message;
			Applet.writeToFile(logFile, logLine);
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
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
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
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
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
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
		});
	},
	saidBattle: function(user, message, me){
		this.addEntry('##battleroom', {
			id: _.uniqueId('e'),
			author: user,
			message: message,
			date: new Date(),
			type: me ? this.MsgType.ME : this.MsgType.NORMAL
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
});
