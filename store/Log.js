/*
 * Handles logging and displaying messages to the user.
 *
 * TODO: Use logging functions in QWeblobbyApplet once they're implemented.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');

module.exports = Reflux.createStore({

	listenables: require('act/Log.js'),

	init: function(){
		_.extend(this, {
			messageBoxes: [],
		});
		// C++ API callin.
		window.alert2 = this.errorBox;
	},
	getInitialState: function(){
		return {
			messageBox: this.messageBoxes.slice(-1)[0],
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},

	MsgType: {
		NORMAL: 0,
		DEBUG: 1,
		INFO: 2,
		WARNINIG: 3,
		ERROR: 4,
	},

	renderMessage: function(args){
		return _.map(args, function(arg){
			if (typeof arg === 'undefined'){
				return '[undefined]';
			} else if (arg === null){
				return '[null]';
			} else if (typeof arg === 'object'){
				try {
					return JSON.stringify(arg);
				} catch(e) {
					return arg.toString();
				}
			} else {
				return arg.toString();
			}
		}.bind(this)).join('\n');
	},

	// Action handlers.
	
	debug: function(){
		console.debug.apply(console, arguments);
	},
	debugBox: function(){
		this.debug.apply(this, arguments);
		this.messageBoxes.push({
			msg: this.renderMessage(arguments),
			title: 'Debug',
			type: this.MsgType.DEBUG,
		});
		this.triggerSync();
	},
	
	info: function(){
		console.info.apply(console, arguments);
	},
	infoBox: function(){
		this.info.apply(this, arguments);
		this.messageBoxes.push({
			msg: this.renderMessage(arguments),
			title: 'Info',
			type: this.MsgType.INFO,
		});
		this.triggerSync();
	},
	
	warning: function(){
		console.warn.apply(console, arguments);
	},
	warningBox: function(){
		this.warning.apply(this, arguments);
		this.messageBoxes.push({
			msg: this.renderMessage(arguments),
			title: 'Warning',
			type: this.MsgType.WARNING,
		});
		this.triggerSync();
	},
	
	error: function(){
		console.error.apply(console, arguments);
	},
	errorBox: function(){
		this.error.apply(this, arguments);
		this.messageBoxes.push({
			msg: this.renderMessage(arguments),
			title: 'Error',
			type: this.MsgType.ERROR,
		});
		this.triggerSync();
	},

	messageBox: function(msg, title){
		this.messageBoxes.push({
			msg: msg || '(no message)',
			title: title || 'Message',
			type: this.MsgType.NORMAL,
		});
		this.triggerSync();
	},
	popMessageBox: function(){
		this.messageBoxes.pop();
		this.triggerSync();
	},
});
