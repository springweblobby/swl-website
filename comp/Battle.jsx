/** @jsx React.DOM
 *
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

var Reflux = require('reflux');
var BattleUserList = require('./BattleUserList.jsx');

module.exports = React.createClass({
	mixins: [Reflux.ListenerMixin],
	// We need custom initialization because the store is passed in a prop.
	componentDidMount: function(){
		console.log(this.props.battle);
		this.unsubscribe = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
	},
	componentWillReceiveProps: function(props){
		if (props.battle !== this.props.battle){
			this.unsubscribe();
			this.unsubscribe = this.listenTo(this.props.battle, this.updateBattle, this.updateBattle);
		}
	},
	componentWillUnmount: function(){
		this.unsubscribe();
	},
	getInitialState: function(){
		return {
			teams: {},
			map: '',
			game: '',
			boxes: {},
		};
	},
	updateBattle: function(data){
		console.log("updateBattle");
		this.setState(data);
	},
	render: function(){
		return <BattleUserList teams={this.state.teams} />;
	}
});
