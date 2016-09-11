/*
 * 
 */

'use strict'

var Reflux = require('reflux');

module.exports = function(){ return Reflux.createStore({

	
	init: function(){
		this.activeQueues = [];
		this.queues = [];
	},
	getInitialState: function(){
		return {
			activeQueues: this.activeQueues,
			queues: this.queues,
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},
	destroyStore: function(){
		this.activeQueues = null;
		this.queues = null;
	},

})};
