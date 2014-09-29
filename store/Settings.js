/*
 * Handles program settings.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');

module.exports = Reflux.createStore({
	
	listenables: require('../act/Settings.js'),

	init: function(){
		this.defaultSettings = {
			name: '',
			password: '',
		};
		_.extend(this, this.defaultSettings);
		_.extend(this, JSON.parse(localStorage.getItem('swl_settings')));
	},

	set: function(key, val){
		this.settings[key] = val;
		localStorage.setItem("swl_settings", JSON.stringify(_.reduce(_.keys(this), function(acc, key){
			if (_.has(this.defaultSettings, key))
				acc[key] = this[key];
		}.bind(this), {})));
		this.trigger(key, val);
	},
});
