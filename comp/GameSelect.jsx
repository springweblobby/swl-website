/*
 * Game/engine selection dialog.
 */

'use strict'

var _ = require('lodash');
var SelectBox = require('comp/SelectBox.jsx');

function splitModName(name){
	var match = name.match(/^(.*) ([^ ]+)$/);
	if (match)
		return { shortName: match[1].replace(/[ -]*$/, ''), version: match[2] };
	else
		return match;
}

module.exports = React.createClass({
	mixins: [React.addons.LinkedStateMixin],
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
		var match = splitModName(this.props.currentGame);
		this.setState({
			selectedGame: match ? match.shortName : this.props.currentGame,
			selectedGameVersion: {
				displayName: match ? match.version : this.props.currentGame,
				trueName: this.props.currentGame,
			},
			selectedEngine: this.props.currentEngine,
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
		_(this.props.games).keys().forEach(function(game){
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
			<ul className="gameNames">{_(gameVersions).keys().map(function(name){
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
