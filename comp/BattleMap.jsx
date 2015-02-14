/*
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
			loadingImage: _.random(1,2),
			minimapLoaded: false,
			maps: {},
		};
	},
	getDefaultProps: function(){
		return {
			map: '', // current map name
			boxes: {}, // startboxes
			team: NaN, // team number (0-based)
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
		this.setState({ minimapLoaded: true }, function(){
			// Re-render startboxes once the minimap is loaded.
			this.forceUpdate();
		}.bind(this));
	},
	renderStartboxes: function(){
		var boxes;
		if (this.isMounted() && this.state.minimapLoaded && this.refs.minimapImg) {
			var node = this.refs.minimapImg.getDOMNode();
			boxes = _.mapValues(this.props.boxes, function(box){
				return _.mapValues({
					left: box.left * node.offsetWidth + node.offsetLeft,
					top: box.top * node.offsetHeight + node.offsetTop,
					height: (1 - box.bottom - box.top) * node.offsetHeight,
					width: (1 - box.right - box.left) * node.offsetWidth,
				}, function(v){ return v + 'px'; });
			});
		} else {
			boxes = _.mapValues(this.props.boxes, function(box){
				return _.mapValues(box, function(v){ return (v * 100) + '%'; });
			});
		}
		return _.map(boxes, function(box, team){
			var fullLabel = parseInt(box.height) > 100 || parseInt(box.width) > 100;
			return <div
				className={'startbox' + (this.props.team == team ? ' myTeam' : '')}
				style={box}
				key={team}
			>
				{fullLabel && <span>Starting area for </span>}Team {parseInt(team) + 1}
			</div>;
		}.bind(this));
	},
	render: function(){
		var map = this.state.maps[this.props.map];
		var label = this.props.map === '' ? 'No map selected' : 'Loading map';

		return <div className={'battleMap mapBg' + this.state.loadingImage}>
			{!this.state.minimapLoaded && <div className="loadingLabel">{label}</div>}
			{map && <div className={this.state.minimapLoaded ? 'minimap' : 'hidden'}>
				<img onLoad={this.handleLoad} src={map.minimap} ref="minimapImg" />
				{this.renderStartboxes()}
			</div>}
			{!this.state.minimapLoaded && this.renderStartboxes()}
		</div>;
	}
});
