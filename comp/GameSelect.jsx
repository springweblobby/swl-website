/*
 * Game/engine selection dialog.
 */

'use strict'

require('style/GameSelect.sass');
var _ = require('lodash');
var React = require('react');
var SelectBox = require('comp/SelectBox.jsx');

function splitModName(name){
	var match = name.match(/^(.*) ([^ ]+)$/);
	if (match)
		return { shortName: match[1].replace(/[ -]*$/, ''), version: match[2] };
	else
		return match;
}

module.exports = React.createClass({
	displayName: 'GameSelect',
	mixins: [require('react-addons-linked-state-mixin')],
	getInitialState: function(){
		return {
			selectedGame: '',
			selectedGameVersion: { trueName: '', displayName: ''},
			selectedEngine: '',
		};
	},
	componentWillMount: function(){
		var gameVersions = this.getGameVersions();
		if (_.size(gameVersions) === 0)
			return;
		var currentGame = this.props.currentGame || _.keys(this.props.games)[0] || '';
		var match = splitModName(currentGame);
		this.setState({
			selectedGame: match ? match.shortName : currentGame,
			selectedGameVersion: {
				displayName: match ? match.version : currentGame,
				trueName: currentGame,
			},
			selectedEngine: this.props.currentEngine || this.props.engines[0] || '',
		});
	},
	handleSelect: function(){
		this.props.onSelectGameEngine(this.state.selectedGameVersion.trueName,
			this.state.selectedEngine);
	},
	handleSelectGame: function(game){
		var gameVersions = this.getGameVersions();
		this.setState({
			selectedGame: game,
			selectedGameVersion: gameVersions[game][0],
		});
	},
	handleSelectGameVersion: function(game){
		this.setState({ selectedGameVersion: game });
	},
	getGameVersions: function(){
		var gameVersions = {};
		_.keys(this.props.games).forEach(function(game){
			var match = splitModName(game);
			if (match) {
				if (!gameVersions[match.shortName])
					gameVersions[match.shortName] = [];
				gameVersions[match.shortName].push({ displayName: match.version, trueName: game });
			} else {
				gameVersions[game] = [{ displayName: game, trueName: game }];
			}
		});
		// Poor man's sorting.
		return _.mapValues(gameVersions, function(arr){ return arr.reverse(); });
	},
	render: function(){
		var gameVersions = this.getGameVersions();
		return <div className="gameSelect">
			<ul className="gameNames">{_.keys(gameVersions).map(function(name){
				return <li
					onClick={_.partial(this.handleSelectGame, name)}
					className={this.state.selectedGame === name ? 'selected' : ''}
					key={name}
				>
					{name}
				</li>;
			}.bind(this))}</ul>
			<ul className="gameVersions">{_.map(gameVersions[this.state.selectedGame], function(game){
				return <li
					onClick={_.partial(this.handleSelectGameVersion, game)}
					className={this.state.selectedGameVersion.trueName === game.trueName ? 'selected' : ''}
					key={game.trueName}
				>
					{game.displayName}
				</li>;
			}.bind(this))}</ul>
			<div className="engineVersions">
				Spring engine version: <SelectBox valueLink={this.linkState('selectedEngine')}>
					{_.map(this.props.engines, function(engine){
						return <div key={engine}>{engine}</div>;
					})}
				</SelectBox>
			</div>
			<div><button onClick={this.handleSelect}>Select</button></div>
		</div>;
	}
});
