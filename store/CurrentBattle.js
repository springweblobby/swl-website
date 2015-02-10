/*
 * This simple store enforces the invariant that only a single battle can be
 * opened at a time.
 *
 * It also provides access to the current battle store.
 */

'use strict'

var Reflux = require('reflux');
var ServerStore = require('./LobbyServer.js');
var Battle = require('../act/Battle.js');
var SBattle = require('./SBattle.js');
var MBattle = require('./MBattle.js');

module.exports = Reflux.createStore({

	listenables: require('../act/Battle.js'),

	init: function(){
		this.currentServerBattle = null;
		this.battleStore = null;
		this.battleTitle = '';

		this.listenTo(ServerStore, this.serverUpdate.bind(this));
	},
	getInitialState: function(){
		return {
			battleTitle: this.battleTitle,
			battleStore: this.battleStore,
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},
	destroyStore: function(){
		this.battleStore.dispose();
		this.battleStore = null;
		this.battleTitle = '';
	},

	serverUpdate: function(data){
		if (this.currentServerBattle && !data.currentBattle) {
			this.destroyStore();
			this.currentServerBattle = null;
		} else if (this.currentServerBattle !== data.currentBattle) {
			this.battleStore && this.destroyStore();
			this.battleStore = MBattle();
			this.battleTitle = data.currentBattle.title;
			this.currentServerBattle = data.currentBattle;
		}
		this.triggerSync();
	},

	// Action handlers.

	closeCurrentBattle: function(){
		if (!this.battleStore)
			return;
		if (this.battleStore.typeTag === MBattle.typeTag) {
			Battle.leaveMultiplayerBattle();
		} else if (this.battleStore.typeTag === SBattle.typeTag) {
			this.destroyStore();
			this.triggerSync();
		}
	},
	openLocalBattle: function(title, init){
		this.battleStore && this.closeCurrentBattle();
		this.battleStore = SBattle();
		this.battleTitle = title;
		init.call(this.battleStore, this.battleStore);
		this.triggerSync();
	},
	hostBattle: function(){
	},
});
