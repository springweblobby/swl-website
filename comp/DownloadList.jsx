'use strict'

require('style/DownloadList.sass');
var _ = require('lodash');
var React = require('react');
var filesize = require('filesize');
var SPM = require('comp/StorePropMixins.js');
var Process = require('act/Process.js');
var Log = require('act/Log.js');
var ModalWindow = require('comp/ModalWindow.jsx');
var SelectBox = require('comp/SelectBox.jsx');
var ProgressBar = require('comp/ProgressBar.jsx');

module.exports = React.createClass({
	displayName: 'DownloadList',
	mixins: [
		require('react-addons-linked-state-mixin'),
		SPM.connect('processStore', '', ['downloads']),
	],
	getInitialState: function(){
		return {
			addingManually: false,
			manualDownloadName: '',
			manualDownloadType: 'game',
		}
	},
	handleCancel: function(name){
		Process.cancelDownload(name);
	},
	handleAddManually: function(evt){
		evt.preventDefault();
		this.setState({ addingManually: true });
	},
	handleManualCancel: function(){
		this.setState({ addingManually: false });
	},
	handleManualStart: function(){
		if (this.state.manualDownloadName === '') {
			Log.warningBox('Enter download name');
			return;
		}

		if (this.state.manualDownloadType === 'engine')
			Process.downloadEngine(this.state.manualDownloadName);
		else if (this.state.manualDownloadType === 'game')
			Process.downloadGame(this.state.manualDownloadName);
		else if (this.state.manualDownloadType === 'map')
			Process.downloadMap(this.state.manualDownloadName);

		this.setState({ addingManually: false });
	},
	getDownloadTitle: function(name, type){
		if (type === 'engine')
			return 'Downloading Spring Engine (version ' + name + ')';
		else if (type === 'game')
			return 'Downloading game ' + name;
		else if (type === 'map')
			return 'Downloading map ' + name;
		else
			return 'Downloading ' + name;
	},
	render: function(){
		return <div className="downloadList">
			<div className="downloads">
				{_.map(this.state.downloads, function(d, name){
					// Ignore everything below 100 kb to avoid jumping progress
					// bar when pr-downloader updates rapid repos.
					var interm = d.total < 102400;
					return <div key={name}>
						{this.getDownloadTitle(d.name, d.type)}
						<ProgressBar indeterminate={interm} value={d.downloaded / d.total} />
						{!interm && Math.round(d.downloaded / d.total * 100) + '%    '}
						({filesize(d.downloaded)} of {filesize(d.total)})
						<button onClick={_.partial(this.handleCancel, name)}>×</button>
					</div>;
				}.bind(this))}
				{_.size(this.state.downloads) === 0 && <h2>No active downloads</h2>}
			</div>
			<a href="#" onClick={this.handleAddManually}>Add manually</a>
			{this.state.addingManually && <ModalWindow
				onClose={this.handleManualCancel}
				title="Manual download"
			><div className="manualDialog">
				<div>Name: <input type="text" valueLink={this.linkState('manualDownloadName')} /></div>
				<div>Download type: <SelectBox valueLink={this.linkState('manualDownloadType')}>
					{/* &nbsp; tail is used to avoid rendering artifacts in QWebKit */}
					<div key="engine">Engine      </div>
					<div key="game">Game</div>
					<div key="map">Map</div>
				</SelectBox></div>
				<div>
					<button onClick={this.handleManualStart}>Start download</button>
					<button onClick={this.handleManualCancel}>Cancel</button>
				</div>
			</div>
			</ModalWindow>}
		</div>;
	}
});
