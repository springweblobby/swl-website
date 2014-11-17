/*
 * Launches spring, pr-downloader, etc.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var Settings = require('./Settings.js');
var Applet = require('./Applet.js');
var SystemInfo = require('./SystemInfo.js');
var ProcessActions = require('../act/Process.js');

module.exports = Reflux.createStore({

	listenables: ProcessActions,

	init: function(){
		_.extend(this, {
			springRunning: false,
		});

		// Callin for the API.
		window.commandStream = function(name, data, exitCode){
			if (name === 'exit') {
				if (data === 'spring') {
					// TODO: check exitCode for cases of dynamic libs missing
					// and complain to the user.
					this.springRunning = false;
					this.triggerSync();
				}
			} else if (name === 'spring') {
				ProcessActions.springOutput(data);
			}
		}.bind(this);
	},
	getDefaultData: function(){
		return {
			springRunning: this.springRunning,
		};
	},
	triggerSync: function(){
		this.trigger(this.getDefaultData());
	},

	launchSpring: function(ver, trailingArgs){
		if (!Applet) return;

		var args = [SystemInfo.springHome + '/weblobby/engine/' + ver +
			(SystemInfo.platform === 'Mac' ? '/Spring_' + ver + '.app/Contents/MacOS' : '') +
			'/spring' + (SystemInfo.platform === 'Windows' ? '.exe' : '')];

		if (Settings.safeMode)
			args.push('--safemode');

		if (Settings.windowedMode)
			args.push('--window');

		if (Settings.resolutionWidth !== null) {
			args.push('--xresolution');
			args.push(Settings.resolutionWidth+'');
		}
		if (Settings.resolutionHeight !== null) {
			args.push('--yresolution');
			args.push(Settings.resolutionHeight+'');
		}

		if (Settings.springCommandPrefix !== '')
			args.unshift(Settings.springCommandPrefix);

		// On Windows with user accounts with non-ASCII names spring incorrectly
		// defaults to c:\My games\Spring instead of Documents\My games\Spring.
		// Adding --write-dir forces the correct behavior.
		if (ver !== '91.0') {
			args.push('--write-dir');
			args.push(SystemInfo.springHome);
		}

		if (Applet.runCommand('spring', args.concat(trailingArgs)) || Applet.getApiVersion() < 200) {
			this.springRunning = true;
			this.triggerSync();
		}
	},

	scriptify: function scriptify(obj, tab){
		tab = tab || '';
		return _.map(obj, function(val, key){
			if (typeof val === 'object')
				return tab  + '[' + key + '] {\n' + scriptify(val, tab+'\t') + tab + '}';
			else
				return tab + key + ' = ' + val + ';';
		}).join('\n') + '\n';
	},

	// Action handlers.

	launchSpringScript: function(ver, script){
		if (!Applet) return;
		var scriptPath = SystemInfo.springHome + '/weblobby/script.spring';
		Applet.createScript(scriptPath, this.scriptify(script));
		this.launchSpring(ver, [scriptPath]);
	},
});
