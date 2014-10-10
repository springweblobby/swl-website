/** @jsx React.DOM
 *
 * The UI represeting a battle room. Ideally this component should be able
 * to render singleplayer, multiplayer and hosted rooms with the differences
 * being abstracted away in the store.
 */

'use strict'

module.exports = React.createClass({
	// We need custom initialization because the store is passed in a prop.
	componentDidMount: function(){
		this.unsubscribe = this.props.battleStore.listen(this.updateBattle, this.updateBattle);
	},
	componentWillReceiveProps: function(props){
		if (props.battleStore !== this.props.battleStore){
			this.unsubscribe();
			this.unsubscribe = props.battleStore.listen(this.updateBattle, this.updateBattle);
		}
	},
	componentWillUnmount: function(){
		this.unsubscribe();
	},
	getInitialState: function(){
		return {
			battle: {
				teams: [],
				map: '',
				game: '',
				boxes: [],
			},
		};
	},
	render: function(){
		return null;
	}
});
