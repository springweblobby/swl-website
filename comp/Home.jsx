/** @jsx React.DOM
 *
 * Main menu.
 */

'use strict'

var _ = require('lodash');
var Screens = require('./ScreenTypes.js');
var ModalWindow = require('./ModalWindow.jsx');
var Battle = require('../act/Battle.js');

module.exports = React.createClass({
	getInitialState: function(){
		return {
			addingEvoSpawner: false,
		};
	},
	handleEvoSkirmish: function(bot){
		Battle.openSinglePlayerBattle('Skirmish vs ' + bot, function(){
			this.setEngine('96.0');
			this.setGame('Evolution RTS - v8.04');
			this.setMap('OnyxCauldron1.6');
			this.addBot(bot, 'Enemy', 2);
		});
		this.setState({ addingEvoSpawner: false });
	},
	handleEvoSpawner: function(){
		this.setState({ addingEvoSpawner: true });
	},
	handleEvoCancel: function(){
		this.setState({ addingEvoSpawner: false });
	},
	handleCustomSkirmish: function(){
		Battle.openSinglePlayerBattle('Custom Skirmish', _.noop);
	},
	render: function(){
		return (<div className="homeScreen">
			<button>Multiplayer</button>
			<button onClick={_.partial(this.handleEvoSkirmish, 'Shard')}>Skirmish vs Shard</button>
			<button onClick={this.handleEvoSpawner}>Skirmish vs Survival Spawner</button>
			<button onClick={this.handleCustomSkirmish}>Custom Skirmish</button>
			<button onClick={_.partial(this.props.onSelect, Screens.SETTINGS)}>Settings</button>

			{this.state.addingEvoSpawner ?
				<ModalWindow onClose={this.handleEvoCancel} title="Choose difficulty">
					{['Very Easy', 'Easy', 'Normal', 'Hard', 'Very Hard'].map(function(diff){
						return (<button key={diff}
							onClick={_.partial(this.handleEvoSkirmish, 'Survival Spawner: ' + diff)}>
							{diff}
						</button>)
					}.bind(this))}
				</ModalWindow>
			: null}
		</div>);
	}
});
