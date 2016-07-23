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

module.exports = function(gameInfoStore){ return Reflux.createStore({

	listenables: ProcessActions,

	init: function(){
		_.extend(this, {
			springRunning: false,
			downloads: {},
			currentProcess: null,
			configVarsStr: '',
		});

		if (!Applet) return;

		// Callin for the API.
		if (window.commandStream !== undefined || window.downloadMessage !== undefined)
			throw new Error('Process: window.commandStream() and downloadMessage() already defined.');
		window.commandStream = function(name, data, exitCode){
			if (name === 'exit') {
				if (data === 'spring') {
					// TODO: check exitCode for cases of dynamic libs missing
					// and complain to the user.
					this.springRunning = false;
					Server.updateStatus({ inGame: false });
					this.triggerSync();
				} else if (data === 'spring-config-vars') {
					try {
						ProcessActions.gotConfigVars(JSON.parse(this.configVarsStr));
					} catch(e) {
						Log.error('Couldn\'t parse output of spring --list-config-vars');
					}
					this.configVarsStr = '';
				} else if (data in this.downloads) {
					if (this.downloads[data].type === 'engine') {
						// Deleting springsettings.cfg disables portable mode. This ensures
						// calling SetSpringSetting() from unitsync will change the global
						// config and not the config in the engine dir, among other things.
						Applet.deleteSpringSettings(SystemInfo.springHome + '/engine/' +
							this.downloads[data].name + '/springsettings.cfg');
					}
					this.downloads[data].done();
					delete this.downloads[data];
					this.triggerSync();
				}
			} else if (name === 'spring') {
				ProcessActions.springOutput(data);
			} else if (name === 'spring-config-vars') {
				this.configVarsStr += data;
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
			if (Applet.getApiVersion() < 105) {
				Applet.downloadFile(sourceUrl + file, targetPath + file);
			} else {
				var downloadID = 'Downloading ' + file;
				this.downloads[downloadID] = { downloaded: 0, total: 0, done: _.noop };
				Applet.startDownload(downloadID, sourceUrl + file, targetPath + file, true);
			}
		}.bind(this));
	},
	getInitialState: function(){
		return {
			springRunning: this.springRunning,
			downloads: this.downloads,
			configVars: this.configVars,
			currentProcess:this.currentProcess,
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

		// Prior to 1.5 runCommand() didn't return false when the command failed.
		if (Applet.runCommand(downloadName, [SystemInfo.springHome + '/weblobby/pr-downloader/' +
				binaryName + (SystemInfo.platform === 'Windows' ? '.exe' : '')].concat(args)) ||
				Applet.getApiVersion() < 105) {
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

	getSpringExecutable: function(ver){
		return SystemInfo.springHome + '/engine/' + ver +
			(SystemInfo.platform === 'Mac' ? '/Spring_' + ver + '.app/Contents/MacOS' : '') +
			'/spring' + (SystemInfo.platform === 'Windows' ? '.exe' : '');
	},

	launchSpring: function(ver, trailingArgs){
		if (!Applet) return;

		var args = [this.getSpringExecutable(ver)];

		if (Settings.safeMode)
			args.push('--safemode');

		if (Settings.windowedMode)
			args.push('--window');

		if (Settings.springCommandPrefix !== '')
			args.unshift(Settings.springCommandPrefix);

		// On Windows with user accounts with non-ASCII names spring incorrectly
		// defaults to c:\My games\Spring instead of Documents\My games\Spring.
		// Adding --write-dir forces the correct behavior.
		if (ver !== '91.0') {
			args.push('--write-dir');
			args.push(SystemInfo.springHome);
		}

		if (Applet.runCommand('spring', args.concat(trailingArgs)) || Applet.getApiVersion() < 105) {
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

	downloadEngine: function(version, done){
		this.launchDownloader(version, 'engine', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome,
			'--download-engine', version], function(){GameInfo.loadEngines();if(done)done();});
	},
	downloadGame: function(name, done){
		this.launchDownloader(name, 'game', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome, '--download-game', name],
			function(){GameInfo.loadGames();if(done)done();});
	},
	downloadMap: function(name, done){
		this.launchDownloader(name, 'map', 'pr-downloader',
			['--filesystem-writepath', SystemInfo.springHome, '--download-map', name],
			function(){GameInfo.loadMaps();if(done)done();});
	},
	cancelDownload: function(name){
		if (name in this.downloads)
			Applet.killCommand(name);
	},
	getConfigVars: function(version, done){
		Applet.runCommand('spring-config-vars',
			[this.getSpringExecutable(version), '--list-config-vars']);
	},
	launchRemoteReplay:function(fileURI, game, map, engine){
		this.currentProcess = "Launching Replay";		
		var gi = gameInfoStore.getInitialState();
		var hasEngine =  _.contains(gi.engines, engine);
		var hasGame =  !!(gi.games[game]);
		var hasMap =  !!(gi.maps[map]);
		
		var parser = document.createElement('a');
		parser.href = fileURI;
		
		fileURI = parser.href;
		
		var target = parser.pathname;
		target = SystemInfo.springHome + '/demos/'+ target.substring(target.lastIndexOf("/") + 1, target.length);
		 		
		var downloadID = "Downloading "+target;
		var that = this;
		
		function maybeLaunchReplay(){
			if (hasEngine && hasGame && hasMap){
				that.launchSpring(engine, target);
				that.currentProcess = null;
			}
		}
		
		this.downloads[downloadID] = { 
			downloaded: 0, 
			total: 0, 
			done: function(){
				if (!hasEngine)	that.downloadEngine(engine, function(){hasEngine=true;maybeLaunchReplay();});
				if (!hasGame) that.downloadGame(game, function(){hasGame=true;maybeLaunchReplay();});
				if (!hasMap) that.downloadMap(map, function(){hasMap=true;maybeLaunchReplay();});
				maybeLaunchReplay();
			}
		};
		
		Applet.startDownload(downloadID, fileURI, [target], true);
	},
})};
