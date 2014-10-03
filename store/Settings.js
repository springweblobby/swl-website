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
			"Server": {
				name: { val:'', name: 'Login', type: 'text' },
				password: { val:'', name: 'Password', type: 'password' },
			},
			"Other": {
				foo: { val:false, name: 'Foo', type: 'bool' },
				bar: { val:true, name: 'Bar', type: 'bool' },
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
