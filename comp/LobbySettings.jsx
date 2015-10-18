'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Settings = require('store/Settings.js');
var Options = require('comp/Options.jsx');
var setSetting = require('act/Settings.js').set;

module.exports = React.createClass({
	displayName: 'LobbySettings',
	mixins: [Reflux.listenTo(Settings, 'updateSetting')],
	getInitialState: function(){
		var settings = {};
		_(Settings.settings).map(_.keys).flatten().forEach(function(key){
			settings[key] = Settings[key];
		}).run();
		return {
			settings: settings,
		};
	},
	updateSetting: function(key){
		var settings = _.clone(this.state.settings);
		settings[key] = Settings[key];
		this.setState({ settings: settings });
	},
	handleChange: function(key, value){
		// We use the trigger() method directly to make sure the action is not
		// run async (which would cause the caret to jump to the end).
		setSetting.trigger(key, value);
	},
	render: function(){
		return <div className="lobbySettings">
			<Options
				values={this.state.settings}
				settings={Settings.settings}
				onChangeSetting={this.handleChange}
			/>
		</div>;
	}
});
