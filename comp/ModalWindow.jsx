/** @jsx React.DOM */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getDefaultProps: function(){
		return {
			title: 'Dialog',
			onClose: _.noop
		};
	},
	render: function(){
		return (<div className="modalOverlay">
			<div className="modalWindow">
				<div className="modalTitle">{this.props.title}</div>
				<div className="modalCloseButton" onClick={this.props.onClose}>×</div>
				<div className="modalContent">{this.props.children}</div>
			</div>
		</div>);
	}
});
