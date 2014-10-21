/** @jsx React.DOM
 *
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

var Reflux = require('reflux');
var BattleUserList = require('./BattleUserList.jsx');
var BattleMap = require('./BattleMap.jsx');
var BattlePanel = require('./BattlePanel.jsx');

module.exports = React.createClass({
	mixins: [Reflux.ListenerMixin],
	// We need custom initialization because the store is passed in a prop.
	componentDidMount: function(){
		this.subscription = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
	},
	componentWillReceiveProps: function(props){
		if (props.battle !== this.props.battle){
			this.subscription.stop();
			this.subscription = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
		}
	},
	componentWillUnmount: function(){
		this.subscription.stop();;
	},
	getInitialState: function(){
		return {
			teams: {},
			map: '',
			game: '',
			engine: '',
			boxes: {},
		};
	},
	updateBattle: function(data){
		this.setState(data);
	},
	handleChangeTeam: function(n){
		this.props.battle.setOwnTeam(n);
	},
	render: function(){
		return (<div className="battleRoom">
			<div className="leftSide">
				<div className="mapTitle">
					<h1>{this.state.map || '(no map selected)'}</h1>
					<span className="mapTitleButtons">
						<button>edit starting boxes</button>
					</span>
				</div>
				<BattleMap map={this.state.map} boxes={this.state.boxes} />
			</div>
			<div className="rightSide">
				<BattlePanel game={this.state.game} engine={this.state.engine} />
				<BattleUserList teams={this.state.teams} onChangeTeam={this.handleChangeTeam} />
			</div>
		</div>);
	}
});
