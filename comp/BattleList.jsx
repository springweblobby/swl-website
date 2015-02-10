/*
 * A list of multiplayer battles.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Battle = require('../act/Battle.js');

module.exports = React.createClass({
	mixins: [Reflux.connectFilter(require('../store/LobbyServer.js'),
		_.partialRight(_.pick, 'battles'))],
	handleJoin: function(id){
		Battle.joinMultiplayerBattle(id);
	},
	render: function(){
		return <div className="battleList">
			{_.map(this.state.battles, function(battle){
				return <p onClick={_.partial(this.handleJoin, battle.id)}>{battle.title} - {battle.map}</p>
			}.bind(this))}
		</div>;
	}
});
