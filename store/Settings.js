/*
 * Handles program settings.
 *
 * You're supposed to access the settings directly, e.g.
 *
 *     var Settings = require('./store/Settings.js');
 *     ...
 *     login(Settings.name, Settings.password)
 * 
 * This is done for convenience because you most likey need a snapshot of what
 * the setting was at the momemnt of execution and reacting to setting changes
 * is not necessary.
 *
 * If you do want to react to settings changes, you can watch the store.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');

module.exports = Reflux.createStore({
	
	listenables: require('../act/Settings.js'),

	init: function(){
		// An object describing the possible settings. The actual values
		// are stored in this, not in this.settings.
		this.settings = {
			"Game": {
				safeMode: { val: false, name: 'Run in safe mode', desc: 'Try this if you get crashes.', type: 'bool' },
				windowedMode: { val: false, name: 'Run in windowed mode instead of fullscreen', type: 'bool' },
				resolutionWidth: { val: NaN, name: 'Screen resolution width', desc: 'Leave empty for default.', type: 'int' },
				resolutionHeight: { val: NaN, name: 'Screen resolution height', desc: 'Leave empty for default.', type: 'int' },
			},
			"Login": {
				name: { val: '', name: 'Login', type: 'text' },
				password: { val: '', name: 'Password', type: 'password' },
			},
			"Selected games": {
				selectedEvo: { val: true, name: 'Evolution RTS', type: 'bool' },
				selectedZk: { val: true, name: 'Zero-K', type: 'bool' },
			},
			"Advanced": {
				lobbyServer: { val: '', name: 'Custom lobby server', type: 'text' },
				springCommandPrefix: { val: '', name: 'Spring command prefix', desc: 'You can set this to optirun or primusrun if you use those', type: 'text' },
				// TODO: springHome
			},
		};
		_.forIn(this.settings, function(vals){
			_.extend(this, _.mapValues(vals, 'val'));
		}.bind(this));
		_.extend(this, JSON.parse(localStorage.getItem('swl_settings')));
	},

	// Action handlers

	set: function(key, val){
		this[key] = val;
		localStorage.setItem("swl_settings", JSON.stringify(_.reduce(
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
