/*
 * Launches spring, pr-downloader, etc.
 */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var Settings = require('store/Settings.js');
var Applet = require('store/Applet.js');
var SystemInfo = require('util/SystemInfo.js');
var ProcessActions = require('act/Process.js');
var GameInfo = require('act/GameInfo.js');
var Log = require('act/Log.js');
var Server = require('act/LobbyServer.js');

module.exports = Reflux.createStore({

	listenables: ProcessActions,

	init: function(){
		_.extend(this, {
			springRunning: false,
			downloads: {},
		});

		if (!Applet) return;

		// Callin for the API.
		window.commandStream = function(name, data, exitCode){
			if (name === 'exit') {
				if (data === 'spring') {
					// TODO: check exitCode for cases of dynamic libs missing
					// and complain to the user.
					this.springRunning = false;
					Server.updateStatus({ inGame: false });
					this.triggerSync();
				} else if (data in this.downloads) {
					this.downloads[data].done();
					delete this.downloads[data];
					this.triggerSync();
				}
			} else if (name === 'spring') {
				ProcessActions.springOutput(data);
			} else if (name in this.downloads) {
				var match;
				if ( (match = data.match(/\[Progress\].*\] ([0-9]+)\/([0-9]+)/)) || // pr-downloader
						(match = data.match(/^progress:([0-9.]+):([0-9.]+)$/)) ) { // HTTP download

					_.extend(this.downloads[name], {
						downloaded: parseFloat(match[1]),
						total: parseFloat(match[2]),
					});
				} else if (data.match(/.*no (engine|mirrors|game|map).*/i)) {
					Log.errorBox('Error ' + name + ':\n' + data.replace(/^.*(): /, ''));
				} else if (data === 'done') { // HTTP download finished
					this.downloads[name].done();
					delete this.downloads[name];
					this.triggerSync();
				}
				this.triggerSync();
			}
		}.bind(this);
		window.downloadMessage = window.commandStream;

		var files;
		if (SystemInfo.platform === 'Windows')
			files = ['pr-downloader.exe', 'zlib1.dll'];
		else
			files = ['pr-downloader'];

		var sourceUrl = location.href.replace(/\/[^\/]*$/, '') + '/pr-downloader/' +
			SystemInfo.platform.toLowerCase() + '/';
		var targetPath = SystemInfo.springHome + '/weblobby/pr-downloader/';
		files.forEach(function(file){
			if (Applet.getApiVersion() < 200) {
				Applet.downloadFile(sourceUrl + file, targetPath + file);
			} else {
				this.downloads['Downloading ' + file] = { downloaded: 0, total: 0, done: _.noop };
				Applet.startDownload('Downloading ' + file, sourceUrl + file, targetPath + file, true);
			}
		}.bind(this));
	},
	getInitialState: function(){
		return {
			springRunning: this.springRunning,
			downloads: this.downloads,
		};
	},
	triggerSync: function(){
		this.trigger(this.getInitialState());
	},

	launchDownloader: function(name, type, binaryName, args, done){
		// We still want to use a readable name for the API because it shows up in the log.
		var downloadName = ['Downloading', type, name].join(' ');

		if (!Applet || downloadName in this.downloads)
			return;

		// Prior to 2.0 runCommand() didn't return false when the command failed.
		if (Applet.runCommand(downloadName, [SystemInfo.springHome + '/weblobby/pr-downloader/' +
				binaryName + (SystemInfo.platform === 'Windows' ? '.exe' : '')].concat(args)) ||
				Applet.getApiVersion() < 200) {
			this.downloads[downloadName] = {
				name: name,
				type: type,
				downloaded: 0,
				total: 0,
				done: done
			};
			this.triggerSync();
		}
	},

	launchSpring: function(ver, trailingArgs){
		if (!Applet) return;

		var args = [SystemInfo.springHome + '/engine/' + ver +
			(SystemInfo.platform === 'Mac' ? '/Spring_' + ver + '.app/Contents/MacOS' : '') +
			'/spring' + (SystemInfo.platform === 'Windows' ? '.exe' : '')];

		if (Settings.safeMode)
			args.push('--safemode');

		if (Settings.windowedMode)
			args.push('--window');

		if (Settings.resolutionWidth !== null) {
			args.push('--xresolution');
			args.push(Settings.resolutionWidth+'');
		}
		if (Settings.resolutionHeight !== null) {
			args.push('--yresolution');
			args.push(Settings.resolutionHeight+'');
		}

		if (Settings.springCommandPrefix !== '')
			args.unshift(Settings.springCommandPrefix);

		// On Windows with user accounts with non-ASCII names spring incorrectly
		// defaults to c:\My games\Spring instead of Documents\My games\Spring.
		// Adding --write-dir forces the correct behavior.
		if (ver !== '91.0') {
			args.push('--write-dir');
			args.push(SystemInfo.springHome);
		}

		if (Applet.runCommand('spring', args.concat(trailingArgs)) || Applet.getApiVersion() < 200) {
			this.springRunning = true;
			Server.updateStatus({ inGame: true });
			this.triggerSync();
		}
	},

	scriptify: function scriptify(obj, tab){
		tab = tab || '';
		return _.map(obj, function(val, key){
			if (typeof val === 'object')
				return tab  + '[' + key + '] {\n' + scriptify(val, tab+'\t') + tab + '}';
			else if (typeof val === 'boolean')
				return tab + key + ' = ' + (val ? '1' : '0') + ';';
			else
				return tab + key + ' = ' + val + ';';
		}).join('\n') + '\n';
	},

	// Action handlers.

	launchSpringScript: function(ver, script){
		if (!Applet) return;
		var scriptPath = SystemInfo.springHome + '/weblobby/script.spring';
		Applet.createScript(scriptPath, this.scriptify(script));
		this.launchSpring(ver, [scriptPath]);
	},
	killSpring: function(){
		Applet.killCommand('spring');
	},

	downloadEngine: function(version){
		this.launchDownloader(version, 'engine', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome,
			'--download-engine', version], GameInfo.loadEngines);
	},
	downloadGame: function(name){
		this.launchDownloader(name, 'game', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome, '--download-game', name],
			GameInfo.loadGames);
	},
	downloadMap: function(name){
		this.launchDownloader(name, 'map', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome, '--download-map', name],
			GameInfo.loadMaps);
	},
	cancelDownload: function(name){
		if (name in this.downloads)
			Applet.killCommand(name);
	},
});
