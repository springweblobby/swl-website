'use strict'

require('style/Help.sass');
var _ = require('lodash');
var React = require('react');
var BattlePanel = require('comp/BattlePanel.jsx');
var BattleUserList = require('comp/BattleUserList.jsx');

var tabs = {
	'Welcome': function(){
		return <div>
			Generic welcome message.<br /><br />
			TODO:
			<ul>
				<li>Buttons to pastebin infolog.txt/weblobby.log</li>
			</ul>
		</div>;
	},
	'Installing Games': function(){
		return <div>
			How to get games.
		</div>;
	},
	'Playing Single Player': function(){
		return <div>
			Pictures of battle room with annotations.
			(Or not even pictures, it should be easy to render the real deal!)
			<br /><br />
			It is:
			<div className="demo battle">
				<BattlePanel
					game="Annihilator Annihilation v1.3"
					engine="99.0"
					hasEngine={true}
					hasGame={true}
					hasMap={true}
					spectating={false}
					springRunning={false}
					inProgress={false}
					multiplayer={false}
					onCloseBattle={_.noop}
					onStartBattle={_.noop}
					onChangeSide={_.noop}
					onSelectMap={_.noop}
					onSelectGame={_.noop}
					onOptions={_.noop}
				/>
			</div>
			<ul>
				<li>The Start Game button predictably causes the game to start.
				If you haven’t downloaded everything completely, it will change
				its color to red and tell you what you’re missing.</li>
				<li>“Annihilator Annihilation” is the game you’re currently playing.</li>
				<li>“spring 99.0” is the engine version. It’s not very important for the lay user, but useful sometimes.</li>
				<li>The buttoms in the bottom allow you to change the current game, map and change some game-specific settings.</li>
			</ul>
			<div className="demo battle">
				<BattleUserList
					teams={{
						1: { 'Player': { name: 'Player' } },
						2: { 'Bender': { name: 'Bender', botType: 'AI', botOwner: 'Player' } },
					}}
					nick="Player"
					onChangeTeam={_.noop}
					onAddBot={_.noop}
					onKick={_.noop}
				/>
			</div>
		</div>;
	},
	'Playing Multiplayer': function(){
		return <div>
			Pictures of player list.
		</div>;
	},
	'Chatting': function(){
		return <div>
			The concept of channels, IRC commands.
		</div>;
	},
};

module.exports = React.createClass({
	displayName: 'Help',
	getInitialState: function(){
		return { selected: 'Welcome' };
	},
	handleSelect: function(tab){
		this.setState({ selected: tab });
	},
	render: function(){
		return <div className="helpScreen">
			<ul className="tabList">
				{_.keys(tabs).map(function(tab){
					return <li
						key={tab}
						onClick={_.partial(this.handleSelect, tab)}
						className={this.state.selected === tab ? 'selected' : ''}
					>{tab}</li>;
				}.bind(this))}
			</ul>
			<div className="tabContent">
				{tabs[this.state.selected].call(this)}
			</div>
		</div>;
	}
});
