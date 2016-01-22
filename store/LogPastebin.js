/*
 * Uploads unitsync.txt and weblobby.log to springpaste.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var request = require('superagent');
var Log = require('act/Log.js');
var Applet = require('store/Applet.js');
var SystemInfo = require('util/SystemInfo.js');
var Settings = require('store/Settings.js');

// paste.springfiles.org has spam protection that limits the size of pastes.
var uploadLimit = 43600;

module.exports = function(){ return Reflux.createStore({
	listenables: require('act/LogPastebin.js'),

	init: function(){
		this.state = { pastebining: false };
		document.paste = this.pastebin.bind(this);
	},
	getInitialState: function(){
		return this.state;
	},
	setState: function(s){
		_.merge(this.state, s);
		this.trigger(this.state);
	},
	pastebin: function(text){
		this.setState({ pastebining: true });
		request.post('http://weblobby.springrts.com/paste.php').type('form').
				send({ text: text, 'private': 1, name: Settings.name, expires: 60 * 24 * 30 }).
				end(function(err, res){
			if (err) {
				Log.errorBox(err);
			} else {
				Log.messageBox('Copy and paste this link: ' + res.text);
			}
			this.setState({ pastebining: false });
		}.bind(this));
	},
	pastebinWeblobbyLog: function(){
		if (!Applet || this.state.pastebining)
			return;
		var log = Applet.readFileLess(SystemInfo.springHome + '/weblobby/weblobby.log', 2500);
		if (!log)
			return;
		var ver = Applet.getApiVersion();
		var prologue = 'API version: ' + Math.floor(ver / 100) + '.' + (ver % 100) + '\n';
		var body = log.slice(-uploadLimit + prologue.length);
		if (body.length < log.length)
			body = body.replace(/^[^\n]*\n/, '');
		this.pastebin(prologue + body);
	},
	pastebinInfolog: function(){
		if (!Applet || this.state.pastebining)
			return;
		// This loses the system info at the beginning if the infolog is too long.
		var log = Applet.readFileLess(SystemInfo.springHome + '/infolog.txt', 2500);
		if (!log)
			return;
		var body = log.slice(-uploadLimit);
		if (body.length < log.length)
			body = body.replace(/^[^\n]*\n/, '');
		echo(body.length);
		this.pastebin(body);
	},
})};
