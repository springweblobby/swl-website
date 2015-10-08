'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	getDefaultProps: function(){
		return {
			title: 'Dialog',
			onClose: _.noop
		};
	},
	handleKey: function(evt){
		if (evt.key === 'Escape') {
			evt.stopPropagation();
			this.props.onClose();
		}
	},
	render: function(){
		return (<div className="modalOverlay">
			<div className="modalWindow" onKeyDown={this.handleKey}>
				<div className="modalTitle">{this.props.title}</div>
				<div className="modalCloseButton" onClick={this.props.onClose}>×</div>
				<div className="modalContent">{this.props.children}</div>
			</div>
		</div>);
	}
});
