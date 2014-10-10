/*
 * A single player battle.
 *
 * This is an exception to the usual pattern of using actions to communicate
 * with the store, since the options for using actions are:
 *  - Actions that take the store as an argument.
 *  - Every store instance generates its own set of actions.
 * Both of those are functionally equivalent to plain methods.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Settings = require('./Settings.js');

var storeDescription = {
	init: function(){
		_.extend(this, {
			teams: [{}],
			map: '',
			game: '',
			boxes: [],
		});
		this.teams[0][Settings.name] = { name: Settings.name };
	},
};

module.exports = _.partial(Reflux.createStore, storeDescription);
