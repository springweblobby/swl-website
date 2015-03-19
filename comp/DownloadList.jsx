'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Process = require('act/Process.js');

module.exports = React.createClass({
	mixins: [
		Reflux.connectFilter(require('store/Process'), _.partialRight(_.pick, 'downloads')),
	],
	handleCancel: function(name){
		Process.cancelDownload(name);
	},
	render: function(){
		return <div className="downloadList">
			{_.map(this.state.downloads, function(d, name){
				return <div key={name}>
					{name} {d.total !== 0 && Math.round(d.downloaded / d.total * 100) + '%'}
					<button onClick={_.partial(this.handleCancel, name)}>×</button>
				</div>;
			}.bind(this))}
		</div>;
	}
});
