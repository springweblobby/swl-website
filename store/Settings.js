/*
 * Handles program settings.
 *
 * You're supposed to access the settings directly, e.g.
 *
 *     var Settings = require('store/Settings.js');
 *     ...
 *     login(Settings.name, Settings.password)
 * 
 * This is done for convenience because you most likey need a snapshot of what
 * the setting was at the momemnt of execution and reacting to setting changes
 * is not necessary.
 *
 * If you do want to react to settings changes, you can watch the store.
 *
 * The value of null in settings with type "int" or "float" represents no
 * setting, i.e. the empty input field.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('store/Applet.js');
var SettingsOverride = require('store/SettingsOverride.js');

module.exports = Reflux.createStore({
	
	listenables: require('act/Settings.js'),

	init: function(){
		// An object describing the possible settings. The actual values
		// are stored in this, not in this.settings.
		this.settings = _.merge({
			"Game": {
				safeMode: { val: false, name: 'Run in safe mode', desc: 'Try this if you get crashes.', type: 'bool' },
				windowedMode: { val: false, name: 'Run in windowed mode instead of fullscreen', type: 'bool' },
				// TODO: Spring 100.0 and upwards doesn't have xresolution/yresolution command line arguments anymore,
				// hook those up to change engine config values.
				resolutionWidth: { val: null, name: 'Screen resolution width', desc: 'Leave empty for default.', type: 'int' },
				resolutionHeight: { val: null, name: 'Screen resolution height', desc: 'Leave empty for default.', type: 'int' },
			},
			"Login": {
				name: { val: '', name: 'Login', type: 'text' },
				password: { val: '', name: 'Password', type: 'password' },
				autoConnect: { val: true, name: 'Connect on launch', type: 'bool' },
				useZkServer: { val: false, name: 'Use Zero-K server', type: 'bool' },
			},
			"Chat": {
				autoJoin: { val: '#weblobby', name: 'Autojoin channels/private messages', type: 'list', desc: 'Can be changed by pressing the heart button in chat. Channels are prefixed with #.' },
				sortColors: { val: false, name: 'Sort players by rank', type: 'bool' },
			},
			"Spring games to show in battle list": {
				selectedAll: { val: true, name: 'Always show all games', type: 'bool' },
				selectedEvo: { val: false, name: 'Evolution RTS', type: 'bool' },
				selectedZk: { val: false, name: 'Zero-K', type: 'bool' },
				selectedBa: { val: false, name: 'Balanced Annihilation', type: 'bool' },
				selectedTa: { val: false, name: 'Tech Annihilation', type: 'bool' },
				selectedXta: { val: false, name: 'XTA', type: 'bool' },
				selectedNota: { val: false, name: 'NOTA', type: 'bool' },
				selectedJauria: { val: false, name: 'JauriaRTS', type: 'bool' },
				selectedS44: { val: false, name: 'Spring 1944', type: 'bool' },
				selectedIw: { val: false, name: 'Imperial Winter', type: 'bool' },
				selectedPa: { val: false, name: 'Planet Annihilation', type: 'bool' },
				selectedMf: { val: false, name: 'Metal Factions', type: 'bool' },
			},
			"Advanced": {
				lobbyServer: { val: '', name: 'Custom lobby server', type: 'text', desc: 'Use lobby.zero-k.info for Zero-K server, leave empty for default.' },
				springHome: { val: Applet && Applet.readSpringHomeSetting() || '', name: 'Installation directory', desc: 'Requires a restart after changing. Leave empty for default.', type: 'text' },
				springCommandPrefix: { val: '', name: 'Spring command prefix', desc: 'You can set this to optirun or primusrun if you use those.', type: 'text' },
				dumpNetwork: { val: false, name: 'Dump network traffic', type: 'bool', desc: 'Dumps all traffic to the log (that includes your password!). Only useful for debugging.' },
			},
		}, SettingsOverride.settings);
		_.forIn(this.settings, function(vals){
			_.extend(this, _.mapValues(vals, 'val'));
		}.bind(this));
		_.extend(this, JSON.parse(localStorage.getItem(SettingsOverride.localStorageKey)));
	},

	// Action handlers

	set: function(key, val){
		if (key === 'springHome')
			Applet && Applet.writeSpringHomeSetting(val);
		this[key] = val;
		localStorage.setItem(SettingsOverride.localStorageKey, JSON.stringify(_.reduce(
			_.flatten(_.map(this.settings, _.keys)),
			function(acc, key){
				acc[key] = this[key];
				return acc;
			}.bind(this),
			{}
		)));
		this.trigger(key);
	},
});
