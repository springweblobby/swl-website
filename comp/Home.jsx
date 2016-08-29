/*
 * Main menu.
 */

'use strict'

require('style/Home.scss');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var Battle = require('act/Battle.js');
var Settings = require('store/Settings.js');
var Applet = require('store/Applet.js');
var Log = require('act/Log.js');
var Process = require('act/Process.js');

var Server = require('act/LobbyServer.js');
var ConState = require('store/LobbyServerCommon.js').ConnectionState;

module.exports = React.createClass({
	displayName: 'Home',
	mixins: [SPM.connect('gameInfoStore', 'gameInfo')],
	getInitialState: function(){
		return {
			choosingDifficulty: null,
		};
	},
	handleMultiplayer: function(){
		if (this.props.serverStore.getInitialState().connection !== ConState.CONNECTED)
			Server.connect();
		this.props.onSelect('battlelist');
	},
	handleOpenUrl: function(url){
		var link = document.createElement('a');
		link.href = url;
		link.click();
	},
	handleSandbox: function(){
		// TODO
		/*var latestEvo = ...;
		Process.launchSpringScript({
			isHost: 1,
			hostIp: '127.0.0.1',
			myPlayerName: Settings.name || 'Player',
			gameType: latestEvo,
			mapName: ...,
			startPosType: ...,
			allyTeam0: {},
			team0: {
				allyTeam: 0,
				side: ...,
				rgbcolor: ...
			}
		});*/
	},
	render: function(){
		return <div className="container">
			<div className="homeScreen">
				<img className="aligncenter displayblock logoimage" src={require('img/evologo.png')} width="1040px" />
				<div className="section group">
					<div className="col span_1_of_2">
						<div className="entry">
							<h1 onClick={this.handleMultiplayer} className="menubutton aligncentertext">Multiplayer</h1>
							<h1 className="menubutton aligncentertext"><a href="https://github.com/EvolutionRTS/Evolution-RTS/wiki" title="How to play"> How to play</a></h1>
							<h1 onClick={_.partial(this.props.onSelect, 'settings')} className="menubutton aligncentertext">Settings</h1>
							<h1 onClick={_.partial(this.props.onSelect, 'help')} className="menubutton aligncentertext">Help</h1>
							<h1 className="menubutton aligncentertext"><a href="https://discord.gg/WUbAs2f" title="Community Discord Server" >Community Discord Server</a></h1>
							<h1 className="menubutton aligncentertext"><a href="http://www.forums.evolutionrts.info" title="Community Forums">Community Forums</a></h1>
							<h1 className="menubutton aligncentertext"><a href="http://www.evolutionrts.info" title="Evolution RTS Website">Evolution RTS Website</a></h1>
						</div>
					</div>
					<div className="col span_1_of_2">
						<div className="entry entry-background">
							<h1 className="news underline-title aligncentertext">Latest News</h1>
							{/* There will be a loop here pulling in rss so the next bit is just for examples */}
							<h2>Evolution RTS v9.00 Released!</h2>
							<p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent orci ipsum, mattis sed pretium vel, pretium sed magna. In mi quam, aliquam vel sapien ut, volutpat rutrum libero. Nunc nibh nisi, ullamcorper in leo eu, imperdiet rutrum metus. Maecenas eu arcu justo. Morbi pulvinar leo tincidunt, malesuada sem et, interdum nibh. Phasellus pulvinar libero ac vestibulum iaculis. Proin sem augue, tincidunt in efficitur at, aliquet congue urna. Curabitur fringilla enim commodo blandit varius. Nulla sed volutpat urna. Nullam vel venenatis turpis. Sed porttitor nisi ac massa maximus, id vulputate sapien imperdiet. Curabitur nec lacus ex. Sed a justo vitae lacus lacinia ornare nec sit amet mauris. Aenean aliquam neque euismod felis hendrerit, eu auctor diam pretium.</p>

							<p> Quisque blandit quis nunc a feugiat. Aliquam et ipsum et tortor semper tempor et egestas ligula. Maecenas a malesuada nibh. Morbi laoreet risus sit amet eros commodo malesuada. Aliquam dignissim posuere fermentum. Morbi a urna quis nibh consectetur iaculis tincidunt quis ipsum. Aliquam vitae diam sed dolor eleifend venenatis tincidunt commodo turpis.</p>

							<p> Aliquam eu diam quam. Aenean porta ac mauris ac pharetra. Aliquam eu finibus ex. Ut tempus nunc turpis, vel iaculis risus molestie a. Curabitur fermentum dolor pretium neque varius viverra. Sed quis accumsan orci, id porta felis. Cras consequat posuere orci vel blandit. Fusce porttitor aliquet lacus eget varius.</p>
							
						</div>
					</div>
				</div>
			</div>
		</div>;
	}
});
