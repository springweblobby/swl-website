'use strict'

// We require Applet before anything that uses localStorage, otherwise init()
// won't set localStorage database path properly.
require('store/Applet.js');

require('style/main.sass');

var _ = require('lodash');
var App = require('comp/App.jsx');

// Create stores.
var gameInfo = new (require('store/GameInfo.js'))();
var process = new (require('store/Process.js'))(gameInfo);
var sound = new (require('store/Sound.js'))();
var lobbyServer = new (require('store/LobbyServer.js'))();
var chatStore = new (require('store/Chat.js'))(lobbyServer, process);
var afkStatus = new (require('store/AfkStatus.js'))(lobbyServer, process);
var currentBattle = new (require('store/CurrentBattle.js'))(gameInfo, lobbyServer, chatStore, process);

// Back when swl API was a Java applet this function was introduced to avoid
// deadlocks on OpenJDK. It's kept to avoid breaking changes.
window.__java_js_wrapper = _.defer;

window.echo = function(){
   console.log.apply(console, arguments ); //chrome has issue with direct assigning of this function
}

React.render(<App
	serverStore={lobbyServer}
	gameInfoStore={gameInfo}
	processStore={process}
	chatStore={chatStore}
	currentBattleStore={currentBattle}
/>, document.getElementById('main'));
