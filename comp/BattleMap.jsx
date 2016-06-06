/*
 * Renders a map.
 */

'use strict'

require('style/BattleMap.sass');
var _ = require('lodash');
var React = require('react');
var SPM = require('comp/StorePropMixins.js');
var classNames = require('classnames');
var Slider = require('comp/Slider.jsx');
var ProgressBar = require('comp/ProgressBar.jsx');
var findDOMNode = require('react-dom').findDOMNode;

var SplitType = {
	VERTICAL: 0,
	HORIZONTAL: 1,
	CORNERS: 2,
	CORNERS_ALT: 3,
};

var DrawingMode = {
	NONE: 0,
	ADD: 1,
	REMOVE: 2,
};

module.exports = React.createClass({
	displayName: 'BattleMap',
	mixins: [
		require('react-addons-linked-state-mixin'),
		SPM.connect('gameInfoStore', '', ['maps']),
	],
	getInitialState: function(){
		return {
			loadingImage: _.random(1,2),
			minimapLoaded: false,
			startboxPanel: false,
			boxSplitPercentage: 25,
			drawingMode: DrawingMode.NONE,
			interimBox: null,
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
		this.setState({
			startboxPanel: !this.state.startboxPanel,
			drawingMode: DrawingMode.NONE,
		});
		document.removeEventListener('click', this.handleCancelDrawing);
	},
	handleAddMode: function(){
		document.addEventListener('click', this.handleCancelDrawing);
		this.setState({ startboxPanel: false, drawingMode: DrawingMode.ADD });
	},
	handleRemoveMode: function(){
		document.addEventListener('click', this.handleCancelDrawing);
		this.setState({ startboxPanel: false, drawingMode: DrawingMode.REMOVE });
	},
	handleStartDrawing: function(evt){
		evt.preventDefault();
		var node = this.refs.minimapImg;
		var rect = node.getBoundingClientRect();
		var x = (evt.clientX - rect.left) / node.clientWidth;
		var y = (evt.clientY - rect.top) / node.clientHeight;
		document.addEventListener('mouseup', this.handleCancelDrawing);
		this.setState({ interimBox: { left: x, top: y, right: 1-x, bottom: 1-y } });
	},
	handleDraw: function(evt){
		if (!this.state.interimBox)
			return;
		evt.preventDefault();
		var node = this.refs.minimapImg;
		var rect = node.getBoundingClientRect();
		var box = _.clone(this.state.interimBox);
		box.right = 1 - (evt.clientX - rect.left) / node.clientWidth;
		box.bottom = 1 - (evt.clientY - rect.top) / node.clientHeight;
		this.setState({ interimBox: box });
	},
	handleCancelDrawing: function(evt){
		if (this.isMounted() && !findDOMNode(this).contains(evt.target)) {
			document.removeEventListener('mouseup', this.handleCancelDrawing);
			document.removeEventListener('click', this.handleCancelDrawing);
			this.setState({ drawingMode: DrawingMode.NONE, interimBox: null });
		}
	},
	handleFinishDrawing: function(){
		if (!this.state.interimBox)
			return;
		this.props.onAddBox(this.state.interimBox);
		document.removeEventListener('mouseup', this.handleCancelDrawing);
		this.setState({ drawingMode: DrawingMode.NONE, interimBox: null });
	},
	handleRemoveBox: function(n){
		this.props.onRemoveBox(n - 1);
		this.setState({ drawingMode: DrawingMode.NONE });
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
		var mapping;
		if (this.state.minimapLoaded && this.refs.minimapImg) {
			var node = this.refs.minimapImg;
			mapping = function(box){
				return _.mapValues({
					left: box.left * node.offsetWidth + node.offsetLeft,
					top: box.top * node.offsetHeight + node.offsetTop,
					height: Math.max((1 - box.bottom - box.top) * node.offsetHeight, 10),
					width: Math.max((1 - box.right - box.left) * node.offsetWidth, 10),
				}, function(v){ return v + 'px'; });
			};
		} else {
			mapping = function(box){
				return _.mapValues(box, function(v){ return (v * 100) + '%'; });
			};
		}
		var boxes = _.mapValues(this.props.boxes, mapping);
		var specBox = {"left":"0px","top":"0px","height":"8%","width":"20%"};
		boxes['-1'] = specBox;
		return _.map(boxes, function(box, idx){
			var fullLabel = parseInt(box.height) > 100 || parseInt(box.width) > 100;
			var team = parseInt(idx) + 1;
			var clickHandler = _.noop;
			if (this.state.drawingMode === DrawingMode.NONE)
				clickHandler = _.partial(this.props.onChangeTeam, team);
			else if (this.state.drawingMode === DrawingMode.REMOVE)
				clickHandler = _.partial(this.handleRemoveBox, team);
			var spectate = team == 0;
			return <div
				className={'startbox' + (this.props.team === team ? ' myTeam' : '')}
				onClick={clickHandler}
				style={box}
				onMouseMove={this.handleDraw}
				onMouseUp={this.handleFinishDrawing}
				key={team}
			><div><div>
				{fullLabel && <span>Starting area for </span>}{spectate ? <span>Spectate</span> :  <span>Team {team}</span>  }
			</div></div></div>;
		}.bind(this)).concat(this.state.interimBox && <div
			className="startbox interim"
			style={mapping(this.state.interimBox)}
			onMouseMove={this.handleDraw}
			onMouseUp={this.handleFinishDrawing}
			key="interim"
		/>);
	},
	render: function(){
		var map = this.state.maps[this.props.map];
		var label = this.props.map === '' ? 'No map selected' : 'Loading map image';
		var sp = this.state.boxSplitPercentage;
		var drawing = this.state.drawingMode === DrawingMode.ADD;
		var download = this.props.download;

		return <div className="battleMap">
			<div className="mapTitle">
				<h1>{this.props.map || '(no map selected)'}</h1>
				{download && <ProgressBar
					indeterminate={download.total === 0}
					value={download.downloaded / download.total}
				/>}
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
					<button onClick={this.handleAddMode}>Draw manually</button>
					<button onClick={this.handleRemoveMode}>Delete</button>
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
			{map && <div className={classNames({
				minimap: this.state.minimapLoaded,
				hidden: !this.state.minimapLoaded,
				adding: this.state.drawingMode === DrawingMode.ADD,
				removing: this.state.drawingMode === DrawingMode.REMOVE,
			})}>
				<img
				style={{height:'80%'}}
					onLoad={this.handleLoad}
					onMouseDown={drawing ? this.handleStartDrawing : _.noop}
					onMouseMove={this.handleDraw}
					onMouseUp={drawing ? this.handleFinishDrawing : _.noop}
					src={map.minimap}
					ref="minimapImg"
				/>
				{this.renderStartboxes()}
			</div>}
			{!this.state.minimapLoaded && this.renderStartboxes()}

			</div>
		</div>;
	}
});
