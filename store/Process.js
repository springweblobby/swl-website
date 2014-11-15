/*
 * Launches spring, pr-downloader, etc.
 */

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
					this.runningSpring = false;
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

		if (isFinite(Settings.resolutionWidth)) {
			args.push('--xresolution');
			args.push(Settings.resolutionWidth+'');
		}
		if (isFinite(Settings.resolutionHeight)) {
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

	// Action handlers.

	launchSpringScript: function(ver, script){
		if (!Applet) return;
		var scriptPath = SystemInfo.springHome + '/weblobby/script.spring';
		Applet.createScript(scriptPath, script);
		this.launchSpring(ver, [scriptPath]);
	},
});
