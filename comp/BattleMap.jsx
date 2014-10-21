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
			maps: {},
		};
	},
	getDefaultProps: function(){
		return {
			map: '',
			boxes: {},
		};
	},
	componentWillReceiveProps: function(props){
		if (props.map !== this.props.map)
			this.setState({ minimapLoaded: false });
	},
	updateMapInfo: function(data){
		this.setState({ maps: data.maps });
	},
	handleLoad: function(){
		this.setState({ minimapLoaded: true });
	},
	render: function(){
		var map = this.state.maps[this.props.map];
		var label = this.props.map === '' ? 'No map selected' : 'Loading map';

		return (<div className={'battleMap mapBg' + this.state.loadingImage}>
			{this.state.minimapLoaded ? null : <div className="loadingLabel">{label}</div>}
			{map ?
				(<div className={this.state.minimapLoaded ? 'minimap' : 'hidden'}>
					<img onLoad={this.handleLoad} src={map.minimap} />
				</div>)
			: null}
		</div>);
	}
});
