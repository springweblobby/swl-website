/** @jsx React.DOM
 *
 * Renders a map.
 */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getInitialState: function(){
		return {
			loadingImage: _.random(1,4),
			minimapLoaded: false,
		};
	},
	componentWillReceiveProps: function(props){
		if (props.map !== this.props.map)
			this.setState({ minimapLoaded: false });
	},
	handleLoad: function(){
		this.setState({ minimapLoaded: true });
	},
	render: function(){
		return (<div className={'battleMap mapBg' + this.state.loadingImage}>
			<div className={this.state.minimapLoaded ? 'minimap' : 'hidden'}>
				<img onLoad={this.handleLoad} src="http://api.springfiles.com/metadata/73ba7491b1b477d83b50c34753db65fc.jpg" />
			</div>
		</div>);
	}
});
