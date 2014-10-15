/*
 * This simple store enforces the invariant that only a single battle can be
 * opened at a time.
 *
 * It also provides access to the current battle store.
 */

'use strict'

var Reflux = require('reflux');
var ServerStore = require('./LobbyServer.js');
var SBattle = require('./SBattle.js');

module.exports = Reflux.createStore({

	listenables: require('../act/Battle.js'),

	init: function(){
		this.battleStore = null;
		this.battleTitle = '';

		this.listenTo(ServerStore, this.serverUpdate);
	},
	getDefaultData: function(){
		return {
			battleTitle: this.battleTitle,
			battleStore: this.battleStore,
		};
	},

	serverUpdate: function(data){
		// TODO: Open a multiplayer battle when we join one.
		// What to do with the singleplayer battle we have open?
	},

	// Action handlers.

	openSinglePlayerBattle: function(title, init){
		this.battleStore && this.battleStore.close();
		this.battleStore = SBattle();
		this.battleTitle = title;
		init.call(this.battleStore, this.battleStore);
		this.trigger({
			battleTitle: this.battleTitle,
			battleStore: this.battleStore,
		});
	},
	hostBattle: function(){
	},
});
