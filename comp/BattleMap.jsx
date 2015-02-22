/*
 * Renders a map.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var GameInfo = require('../store/GameInfo.js');
var Slider = require('./Slider.jsx');

var SplitType = {
	VERTICAL: 0,
	HORIZONTAL: 1,
	CORNERS: 2,
	CORNERS_ALT: 3,
};

module.exports = React.createClass({
	mixins: [React.addons.LinkedStateMixin,
		Reflux.listenTo(GameInfo, 'updateMapInfo', 'updateMapInfo')],
	getInitialState: function(){
		return {
			loadingImage: _.random(1,2),
			minimapLoaded: false,
			maps: {},
			startboxPanel: false,
			boxSplitPercentage: 25,
		};
	},
	getDefaultProps: function(){
		return {
			map: '', // current map name
			boxes: {}, // startboxes
			team: NaN, // team number
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
	handleEditBoxes: function(){
		this.setState({ startboxPanel: !this.state.startboxPanel });
	},
	handleSplit: function(type){
		var sp = 1 - this.state.boxSplitPercentage / 100;
		var add = this.props.onAddBox;
		this.props.onClearBoxes();
		if (type === SplitType.VERTICAL) {
			add({ top: 0, left: 0, bottom: 0, right: sp });
			add({ top: 0, right: 0, bottom: 0, left: sp });
		} else if (type === SplitType.HORIZONTAL) {
			add({ top: 0, left: 0, right: 0, bottom: sp });
			add({ left: 0, right: 0, bottom: 0, top: sp });
		} else if (type === SplitType.CORNERS) {
			add({ top: 0, left: 0, bottom: sp, right: sp });
			add({ top: sp, left: sp, bottom: 0, right: 0 });
			add({ top: 0, left: sp, bottom: sp, right: 0 });
			add({ top: sp, left: 0, bottom: 0, right: sp });
		} else if (type === SplitType.CORNERS_ALT) {
			add({ top: 0, left: 0, bottom: sp, right: sp });
			add({ top: 0, left: sp, bottom: sp, right: 0 });
			add({ top: sp, left: sp, bottom: 0, right: 0 });
			add({ top: sp, left: 0, bottom: 0, right: sp });
		}
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
			team = parseInt(team);
			return <div
				className={'startbox' + (this.props.team === team + 1 ? ' myTeam' : '')}
				onClick={_.partial(this.props.onChangeTeam, team + 1)}
				style={box}
				key={team}
			><div><div>
				{fullLabel && <span>Starting area for </span>}Team {team + 1}
			</div></div></div>;
		}.bind(this));
	},
	render: function(){
		var map = this.state.maps[this.props.map];
		var label = this.props.map === '' ? 'No map selected' : 'Loading map';
		var sp = this.state.boxSplitPercentage;

		return <div className="battleMap">
			<div className="mapTitle">
				<h1>{this.props.map || '(no map selected)'}</h1>
				<span className="mapTitleButtons">
					<button onClick={this.handleEditBoxes}>edit starting areas</button>
				</span>
			</div>
			<div className={'map mapBg' + this.state.loadingImage}>

			<div className={'startboxPanel' + (this.state.startboxPanel ? '' : ' hidden')}>
				<div className="bigButton">
					<button>Load default</button>
				</div>
				<div className="manual">
					<button>Draw manually</button>
					<button>Delete</button>
					<button onClick={this.props.onClearBoxes}>Delete all</button>
				</div>
				<div className="generate">
					<div>Split size</div>
					<Slider
						valueLink={this.linkState('boxSplitPercentage')}
						minValue={15}
						maxValue={50}
					/>
				</div>
				<div className="split">
				<div className="bigButton">
					<button onClick={_.partial(this.handleSplit, SplitType.VERTICAL)}><div>
						<div style={{ left: 0, top: 0, bottom: 0, width: sp + '%' }}>1</div>
						<div style={{ right: 0, top: 0, bottom: 0, width: sp + '%' }}>2</div>
					</div></button>
				</div>
				<div className="bigButton">
					<button onClick={_.partial(this.handleSplit, SplitType.HORIZONTAL)}><div>
						<div style={{ left: 0, right: 0, top: 0, height: sp + '%' }}>1</div>
						<div style={{ left: 0, right: 0, bottom: 0, height: sp + '%' }}>2</div>
					</div></button>
				</div>
				<div className="bigButton">
					<button onClick={_.partial(this.handleSplit, SplitType.CORNERS)}><div>
						<div style={{ left: 0, top: 0, height: sp + '%', width: sp + '%' }}>1</div>
						<div style={{ right: 0, bottom: 0, height: sp + '%', width: sp + '%' }}>2</div>
						<div style={{ right: 0, top: 0, height: sp + '%', width: sp + '%' }}>3</div>
						<div style={{ left: 0, bottom: 0, height: sp + '%', width: sp + '%' }}>4</div>
					</div></button>
				</div>
				<div className="bigButton">
					<button onClick={_.partial(this.handleSplit, SplitType.CORNERS_ALT)}><div>
						<div style={{ left: 0, top: 0, height: sp + '%', width: sp + '%' }}>1</div>
						<div style={{ right: 0, bottom: 0, height: sp + '%', width: sp + '%' }}>3</div>
						<div style={{ right: 0, top: 0, height: sp + '%', width: sp + '%' }}>2</div>
						<div style={{ left: 0, bottom: 0, height: sp + '%', width: sp + '%' }}>4</div>
					</div></button>
				</div>
				</div>
				{/* TODO: Transplant the radial box generator from old swl. */}
			</div>

			{!this.state.minimapLoaded && <div className="loadingLabel">{label}</div>}
			{map && <div className={this.state.minimapLoaded ? 'minimap' : 'hidden'}>
				<img onLoad={this.handleLoad} src={map.minimap} ref="minimapImg" />
				{this.renderStartboxes()}
			</div>}
			{!this.state.minimapLoaded && this.renderStartboxes()}

			</div>
		</div>;
	}
});
