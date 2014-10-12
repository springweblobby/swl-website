/** @jsx React.DOM
 *
 * Renders a map.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var GameInfo = require('../store/GameInfo.js');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(GameInfo, 'updateMapInfo', 'updateMapInfo')],
	getInitialState: function(){
		return {
			loadingImage: _.random(1,4),
			minimapLoaded: false,
			minimap: '',
		};
	},
	componentWillReceiveProps: function(props){
		if (props.map !== this.props.map)
			this.setState({ minimapLoaded: false });
	},
	updateMapInfo: function(data){
		if (this.props.map in data.maps){
			this.setState(data.maps[this.props.map]);
		}
	},
	handleLoad: function(){
		this.setState({ minimapLoaded: true });
	},
	render: function(){
		return (<div className={'battleMap mapBg' + this.state.loadingImage}>
			{this.state.minimapLoaded ? null : <div className="loadingLabel">Loading map...</div>}
			<div className={this.state.minimapLoaded ? 'minimap' : 'hidden'}>
				<img onLoad={this.handleLoad} src={this.state.minimap} />
			</div>
		</div>);
	}
});
