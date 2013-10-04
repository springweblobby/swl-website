///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/Lobby',
	[
		"dojo/_base/declare",

		'dojo/topic',
		'dojo/query',
		'dojo/_base/window',
		
		'lwidgets/LobbySettings',
		'lwidgets/ChatManager',
		'lwidgets/BattleManager',
		'lwidgets/ChatRoom',
		'lwidgets/MBattleRoom',
		'lwidgets/SBattleRoom',
		'lwidgets/BattleMap',
		'lwidgets/User',
		'lwidgets/DownloadManager',
		'lwidgets/UserList',
		'lwidgets/Juggler',
		'lwidgets/ConfirmationDialog',
		
		'dojo/text!./templates/lobby.html?' + cacheString,
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojo/on',
		'dojo/Deferred',
		'dojo/_base/unload',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dijit/Dialog',
		'dijit/form/Button',
		'dijit/form/Select',
		'dijit/form/FilteringSelect',
		
		'dijit/layout/TabContainer',
		// *** extras ***
		
		'dojo/text', 
		
		'dijit/layout/BorderContainer',
		
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		
		
		'dijit/_Templated',
		
		//'dojo/data',
	
	],
	function(declare,
			
			//dojo, dijit,
			topic,
			query, win,
			
			LobbySettings,
			ChatManager,
			BattleManager,
			Chatroom,
			MBattleRoom, 
			SBattleRoom, 
			BattleMap,
			User,
			DownloadManager,
			UserList,
			Juggler,
			ConfirmationDialog,
			
			template, WidgetBase, Templated, WidgetsInTemplate,
			
			array, domConstruct, domStyle, domAttr, lang,
			xhr, on,
			Deferred,
			baseUnload,
			
			Memory,
			Observable,
			
			Dialog,
			Button,
			Select,
			TabContainer
	){


declare("AppletHandler", [ ], {
	
	modList: null,
	
	settings: null,
	path: '',
	
	os: '',
	slash: '/',
	commandStreamOut: null,
	version: 0,
	unitSyncs: null,
	springHome: '',
	applet: null,
	
	constructor: function(args)
	{
		var i;
		declare.safeMixin(this, args);
		this.commandStreamOut = [];
		this.modList = [];
		this.applet = document.WeblobbyApplet;
		if( this.applet.init === undefined )
		{
			alert('Java applet failed to load. Make sure nothing is blocking it. \n If you\'re using a Mac, see <a href="http://helpx.adobe.com/x-productkb/global/install-java-jre-mac-os.html">this page</a> for help on installing Java.');
		}
		if(this.settings.settings.springHome != '')
		{
			this.applet.setSpringHome(this.settings.settings.springHome);
		}
		this.applet.init();
		this.springHome = this.applet.getSpringHome();
		topic.subscribe('Lobby/commandStream', lang.hitch( this, 'commandStream') );
		topic.subscribe('Lobby/writeLog', lang.hitch( this, 'writeLog') );
		this.downloadDownloader()
		if( this.os === 'Windows' )
		{
			this.slash = '\\';
		}
		this.unitSyncs = {};
		
		//echo( this.applet.getMacAddress() );
		//echo( this.applet.getUserID() );
	},
	getUserID:function()
	{
		return this.applet.getUserID();
	},
	sendSomePacket: function()
	{
		var internalPort;
		var internalPort = -1;
		if( this.server )
		{
			echo('sending packet', this.server, this.udpPort, this.lobby.nick )
			internalPort = this.applet.sendSomePacket(this.server, this.udpPort, this.lobby.nick )
			//echo('internalPort', internalPort)
		}
		return internalPort;
	},
	sendSomePacketToClient: function(ip, port)
	{
		echo('sending packet', ip, port, 'hi' )
		this.applet.sendSomePacket( ip, port, 'hi' );
	},
	
	createDir: function(dir)
	{
		this.applet.createDir(dir);
	},
	
	getSocketBridge: function()
	{
		return this.applet;
	},
	
	getLogFile: function( type, logFile )
	{
		if( type === 'user' )
		{
			return this.springHome + '/weblobby/logs/' + logFile + '.txt';;
		}
		else if( type === 'channel' )
		{
			return this.springHome + '/weblobby/logs/#' + logFile + '.txt';
		}
		else if( type === 'battle' )
		{
			return this.springHome + '/weblobby/logs/##battleroom.txt';
		}
		
		return logFile;
	},
	
	writeLog: function( type, logFile, line )
	{
		var success;
		logFile = this.getLogFile( type, logFile);
		success = this.applet.WriteToFile( logFile, line );
	},
	readLog: function( type, logFile )
	{
		logFile = this.getLogFile( type, logFile);
		return this.applet.ReadFileLess( logFile, 50 );
	},
	
	listDirs: function(path)
	{
		var dirs;
		dirs = this.applet.listDirs(path).split('||');
		if( dirs.length === 1 && dirs[0] === '' )
		{
			dirs = [];
		}
		return dirs;
	},
	listFiles: function(path)
	{
		var files;
		files = this.applet.listFiles(path).split('||');
		if( files.length === 1 && files[0] === '' )
		{
			files = [];
		}
		return files;
	},
	
	getEngineVersions: function()
	{
		return this.listDirs( this.springHome + '/weblobby/engine')
	},
	getReplays: function()
	{
		return this.listFiles( this.springHome + '/demos' )
	},
	
	refreshUnitsync: function(version) //fixme: prevent thrashing
	{
		var curVersion;
		var curUnitSync;
		if( version !== null && typeof version !== 'undefined' )
		{
			curUnitSync = this.getUnitsync(version)
			if( curUnitSync !== null )
			{
				try
				{
				
					console.log('Refreshing unitsync for version ' + version, curUnitSync.getSpringVersion() )
					if( this.os === 'Mac' && version === '91.0' )
					{
						alert('There is a known bug when reloading Spring data for version 91.0 on Mac. You will need reload the page if you recently reloaded mods/maps.');
						return;
					}
					curUnitSync.Unregister()
					curUnitSync.Reregister()
					
					curUnitSync.unInit();
					
					
					curUnitSync.init(false, 7); // causes JVM exit problem on mac if called more than once for 91
					curUnitSync.getPrimaryModCount();
					curUnitSync.getMapCount();
					echo('end Refreshing unitsync for version ' + version , curUnitSync.getSpringVersion() )
				}
				catch(e)
				{
					console.log('unitsync init exception!', e);
					alert2('The applet may have exited unexpectedly. You will need to reload the page.' );
				}
			}
			topic.publish('Lobby/unitsyncRefreshed', version);
		}
		else
		{
			for( curVersion in this.unitSyncs )
			{
				this.refreshUnitsync(curVersion);
			}
			
		}
		
	},

	startSpringSettings: function(version)
	{
		var springCommand, springCfg;
		springCfg = this.getEngineCfg(version);
		springCommand = this.getEngineExec(version);
		this.applet.deleteSpringSettings( springCfg );
		this.getUnitsync(version).setSpringConfigString('SpringData', this.springHome );
		this.lobby.setIsInGame(true)
		this.runCommand('spring',[ springCommand ]);
	},
	
	startSpringScript: function(script, version)
	{
		var scriptFile;
		scriptFile = this.springHome + '/weblobby/script.spring'
		this.applet.createScript( scriptFile, script );
		this.startSpring( [ scriptFile ], version )
	},
	startSpringReplay: function(replay, version)
	{
		var replayFile;
		replayFile = this.springHome + '/demos/' + replay;
		this.startSpring( [ replayFile ], version )
	},
	
	startSpring: function(params, version)
	{
		var springCommand;
		//var scriptFile;
		var uikeysFile;
		var springCfg;
		var cmdArray;
		var springPrefix;
		springCommand = this.getEngineExec(version);
		//scriptFile = this.springHome + '/weblobby/script.spring'
		springCfg = this.getEngineCfg(version);
		uikeysFile = this.getEnginePath(version) + '/uikeys.txt' ;
		
		//this.applet.createScript( scriptFile, script );
		this.applet.deleteSpringSettings( springCfg );
		this.applet.createUiKeys( uikeysFile );
		
		//cmdArray = [ springCommand, scriptFile ];
		cmdArray = params;
		if( this.settings.settings.springSafeMode )
		{
			//cmdArray = [ springCommand, '--safemode', scriptFile ];
			cmdArray.unshift( '--safemode' );
		}
		cmdArray.unshift( springCommand );
		
		springPrefix = this.settings.settings.springPrefix.trim();
		if( springPrefix !== '' )
		{
			cmdArray.unshift(springPrefix)
		}
		
		this.lobby.setIsInGame(true)
		this.runCommand('spring', cmdArray );
		
	},
	
	//cmdName must not contain slashes or single quotes.
	runCommand: function(cmdName, cmds)
	{		
		this.commandStreamOut = [];
		echo( 'Running command:', cmds );
		setTimeout( function(applet, cmdName, cmds){
			//console.log(cmds) //issue for chromium, see java
			applet.runCommand(cmdName, cmds);
		}, 1, this.applet, cmdName, cmds );
		
	},
	
	killCommand: function( processName )
	{
		setTimeout( function(applet, processName){
			applet.killCommand( processName );
		}, 1, this.applet, processName );
	},
	
	commandStream: function(data)
	{
		var noDownloadMatch;
		var exitingCommand;
		if( data.cmdName === 'exit' )
		{
			exitingCommand = data.line;
			if( exitingCommand === 'spring' )
			{
				this.lobby.setIsInGame(false)

				if( this.authorized && !this.lobby.users[ this.lobby.nick ].isAway )
				{
					this.lobby.setNotIdle();
				}
			}
			return;
		}
		echo('<js> ' + data.cmdName + ' >> '  + data.line);
		//this.commandStreamOut.push(data.line);
		// [Error] ../../../../../tools/pr-downloader/src/main.cpp:173:main(): No engine version found for 93.1
		if( data.line.search('[Error]') !== -1 )
		{
			noDownloadMatch = data.line.toLowerCase().match(
				'.*no engine.*|.*no mirrors.*|.*no game found.*|.*no map found.*|.*error occured while downloading.*'
			);
			if( noDownloadMatch !== null )
			{
				alert2('Problem downloading: ' + data.line);
			}
		}

	},
	
	downloadDownloader: function()
	{
		var targetPath;
		var files = [];
		if(this.os === 'Windows')
		{
			targetPath = this.springHome + '\\weblobby\\pr-downloader\\';
			files = [
				'pr-downloader.exe',
				//'pr-downloader_shared.dll',
				'zlib1.dll',
			];
		}
		else if(this.os === 'Linux' || this.os === 'Linux64' )
		{
			targetPath = this.springHome + '/weblobby/pr-downloader/';
			files = [
				'pr-downloader',
				//'libpr-downloader_shared.so',
				//'libpr-downloader_static.a',
			];
		}
		else if(this.os === 'Mac')
		{
			targetPath = this.springHome + '/weblobby/pr-downloader/';
			files = [
				'pr-downloader',
				//'libpr-downloader_shared.dylib',
				//'libpr-downloader_static.a',
			];
		}
		
		if( typeof this.applet.downloadFile !== 'function' )
		{
			alert2('Java applet failed to load. Please make sure you installed java and enabled it in your browser.')
			return;
		}
		this.javaLoaded = true;
		
		array.forEach( files, function(file) {
			this.applet.downloadFile(
				location.href.replace(/\/[^\/]*$/, '') + '/pr-downloader/' + this.os.toLowerCase() + '/' + file,
				targetPath + file
			);
		}, this);
		
	},
	
	getEnginePath: function(version)
	{
		if( this.os === 'Windows' )
		{
			path = this.springHome + '\\weblobby\\engine\\' + version;
		}
		else if( this.os === 'Mac' )
		{
			path = this.springHome + '/weblobby/engine/'+version+'/Spring_' + version + '.app/Contents/MacOS';
		}
		else if(this.os === 'Linux' || this.os === 'Linux64' )
		{
			path = this.springHome + '/weblobby/engine/'+version;
		}
		return path;
	},
	
	getEngineExec: function(version)
	{
		return this.getEnginePath(version) + this.slash + 'spring';
	},
	getEngineCfg: function(version)
	{
		return this.getEnginePath(version) + this.slash + 'springsettings.cfg';
	},
	
	getUnitSyncPath: function(version)
	{
		if( this.os === 'Windows' )
		{
			return this.getEnginePath(version) + '\\unitsync.dll';
		}
		else if( this.os === 'Linux' || this.os === 'Linux64' )
		{
			return this.getEnginePath(version) + '/libunitsync.so';
		}
		else if( this.os === 'Mac' )
		{
			return this.getEnginePath(version) + '/libunitsync.dylib';
		}
		return ''
	},
	
	getUnitsync: function(version)
	{
		var path;
		var unitSync;
		var curVersion;
		if( version === '0' )
		{
			alert2('No Spring version selected.')
			return null;
		}
		/*
		if(this.os == 'Mac') //return first version
		{
			for( curVersion in this.unitSyncs )
			{
				return this.unitSyncs[curVersion]
			}
		}
		*/
		if( version in this.unitSyncs )
		{
			return this.unitSyncs[version];
		}
		/**/
		setTimeout( function(thisObj, version){
			thisObj.loadUnitsync(version)
		}, 1, this, version );
		/**/
		//this.loadUnitsync(version)
		return null;
	},
	initOnce: false,
	loadUnitsync: function(version)
	{
		var unitSync, path;
		path = this.getUnitSyncPath(version);
		
		/**/
		//echo('loadUnitsync', path)
		unitSync = this.applet.getUnitsync(path);
		
		if( unitSync !== null && typeof unitSync !== 'undefined' )
		{
			try
			{
				//unitSync.unInit();
				console.log ('Loading unitsync version', version, unitSync.getSpringVersion() )
				if( this.os === 'Mac' && version === '91.0' && this.initOnce )
				{
					alert('There is a known bug when reloading Spring data for version 91.0 on Mac. You will need reload the page if you recently reloaded mods/maps.');
					return;
				}
				
				this.initOnce = true;
				
				unitSync.Unregister();
				unitSync.Reregister();
				
				unitSync.init(false, 7); // causes JVM exit problem on mac if called more than once for 91
				unitSync.getPrimaryModCount();
				unitSync.getMapCount();
				this.unitSyncs[version] = unitSync;
				this.unitSyncs[version].setSpringConfigString('SpringData', this.springHome );
				//this.refreshUnitsync(version);
			}
			catch(e)
			{
				console.log('unitsync init exception!', e);
				alert2('The applet may have exited unexpectedly. You will need to reload the page.' );
			}
			topic.publish('Lobby/unitsyncRefreshed', version);
		}
		else
		{
			if( ( this.os === 'Linux' || this.os === 'Linux64' ) && version === '91.0' )
			{
				alert('It appears you want to play in a room using the 91.0 version of the spring engine. 91.0 is old and doesn\'t have official static linux builds provided. Please use the link in the Help tab to download the <b>' +
					( this.os === 'Linux' ? '32-bit' : '64-bit' ) + '</b> version manually.');
			}
			else
			{
				this.downloadManager.downloadEngine(version);
			}
		}
		
	},
	
	jsReadFileVFS: function(fd, size, version)
	{
		var path;
		path = this.getUnitSyncPath(version);
		try
		{
			return this.applet.jsReadFileVFS(path, fd, size );
		}
		catch( e )
		{
			alert2('There was a problem accessing Spring. Please check that: \n- Java is enabled. \n- Your path to Spring in the settings tab is correct. \n\nYou will need to reload the page.');
		}
		return '';
		
	},
	
	//console.log( "TEST2: " + this.getWeblobbyApplet().getSpringVersion() );
	
	blank: null
});//declare UnitSync


return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	pingPongTime: 30000,
	lostPongs: 0,
	
	nick: '',
	password: '',
	url : 'springrts.com',
	port : '8200',
	agreementTextTemp: '',
	agreementText: '',
	serverSpringVer: '',
	localSpringVer: '',
	serverClientVer: '',
	localClientVer: '',
	
	udpPort: '',
	serverMode: '',
	
	widgetsInTemplate: true,
	connected : false,
	authorized : false,
	registering: false,
	startMeUp: true,
	
	tc: null,
	mainContainer: null,
	connectButton: null,
	battleRoom: null,
	sBattleRoom: null,
	battleManager: null,
	userList: null,
	settings: null,
	renameButton: null,
	changePassButton: null,
	users: null,
	
	battleListStore: null,
	battleList: null,
	
	juggler: null,
	
	appletHandler: null,
	
	javaLoaded: false,
	
	idleTimeout: null,
	
	newBattleReady: false,
	newBattlePassword: '',
	
	downloadManagerPaneId: '??', 
	chatManagerPaneId: '??',
	scriptPassword: '',
	
	//'constructor':function(){},
	
	templateString : template,
	
	weblobbyVersion:0.001,
	
	ResizeNeeded: function()
	{
		topic.publish('ResizeNeeded', {} );
		this.userList.resizeAlready();
	},
	
	onLinux64: function()
	{
		return ( navigator.oscpu === 'Linux x86_64' || navigator.platform === 'Linux x86_64' ) 
	},
	
	postCreate : function() //lobby postCreate
	{
		this.inherited(arguments);
		this.os = BrowserDetect.OS;
		
		if( this.onLinux64() )
		{
			this.os = 'Linux64'
		}
		
		if( array.indexOf(['Windows', 'Linux', 'Linux64', 'Mac'], this.os ) === -1 )
		{
			alert2('Your operating system ('+ this.os +') is not compatible with Spring or is not recognized.');
		}
		
		this.users = {};
		this.bots = {};
		
		this.scriptPassword = 'swl' + Math.round( Math.random()*1000000 );
		this.setupStore();
		this.battleList = {};
		
		this.settings = new LobbySettings();
		this.settingsPane.set('content', this.settings);
		
		this.appletHandler = new AppletHandler( {settings: this.settings, os: this.os, lobby: this } )
		
		if( !this.appletHandler.javaLoaded )
		{
			return;
		}
		
		this.downloadManager = new DownloadManager( {settings: this.settings, appletHandler: this.appletHandler, os: this.os } );
		
		this.appletHandler.downloadManager = this.downloadManager;
		this.settings.appletHandler = this.appletHandler;
		
		this.downloadManagerPane.set('content', this.downloadManager );
		this.chatManager = new ChatManager( {settings: this.settings, users: this.users, appletHandler: this.appletHandler } );
		this.chatManagerPane.set('content', this.chatManager );
		this.battleManager = new BattleManager( {
			store: this.battleListStore,
			scriptPassword: this.scriptPassword,
			users: this.users,
			settings: this.settings
		} );
		this.battleManagerPane.set('content', this.battleManager );
		//this.helpPane.set('content', this.getHelpContent() );
		this.getHelpContent();
		this.battleRoom = new MBattleRoom( {
			settings: this.settings,
			nick: this.nick,
			users: this.users,
			appletHandler: this.appletHandler,
			downloadManager: this.downloadManager,
			battleListStore: this.battleListStore,
			scriptPassword: this.scriptPassword,
			log: this.appletHandler.readLog( 'battle', '' ),
		} );
		this.bottomPane.set('content', this.battleRoom );
		/** /
		this.bottomPane.on('click', lang.hitch(this, function(){
			console.log('b')
			this.bottomPane.resize({'h':600});
			
		}));
		this.topPane.on('click', lang.hitch(this, function(){
			console.log('a')
			this.bottomPane.resize({'h':200});
			
		}));
		
		/**/
		var localUsers, localMe, localName;
		
		if( this.settings.settings.name === '' )
		{
			localName = '(Local)NoName';
		}
		else
		{
			localName = '(Local)' + this.settings.settings.name;
		}
		localUsers = {}
		localMe = new User({
			name: localName,
			cpu: '123',
			country: 'unknown',
			battleId: -1,
			rank: 0,
			local: true
		});
		
		localMe.setStatusVals({
			isReady: true,
			isSpectator: true,
			allyNumber: 0,
			teamNumber: 0,
			syncStatus: 'Synced'
		});
		localUsers[localName] = localMe;
		this.sBattleRoom = new SBattleRoom( {
			local: true,
			settings: this.settings,
			nick: localName,
			users: localUsers,
			appletHandler: this.appletHandler,
			downloadManager: this.downloadManager,
			battleListStore: this.battleListStore, //remove
			//'scriptPassword':this.scriptPassword //remove
		} );
		this.singlePane.set('content', this.sBattleRoom );
		
		
		this.userList = new UserList({name: 'server list'});
		this.juggler = new Juggler({});
		
		
		this.subscribe('Lobby/receive', function(data){ this.uberReceiver(data.msg) });
		this.subscribe('Lobby/rawmsg', function(data){ this.uberSender(data.msg) });
		this.subscribe('Lobby/notidle', 'setNotIdle');
		//this.subscribe('Lobby/makebattle', 'makeBattle');
		this.subscribe('Lobby/focuschat', 'focusChat');
		this.subscribe('Lobby/focusDownloads', 'focusDownloads');
		this.subscribe('Lobby/setNewBattleReady', function(password){
			this.newBattleReady = true;
			this.newBattlePassword = password
		} );
		
		baseUnload.addOnUnload( lang.hitch(this, 'disconnect') );
		
		this.downloadManagerPaneId = this.downloadManagerPane.id; 
		this.chatManagerPaneId = this.chatManagerPane.id; 
		
		
		this.chatManagerPane.on( 'show', lang.hitch( this, function(){ this.chatManager.resizeAlready();  } ) );
		
		
		setInterval( lang.hitch(this, 'pingPong'), this.pingPongTime, this );
		setInterval( function(){
			date = new Date;
			if( date.getMinutes() === 0 )
			{
				topic.publish( 'Lobby/chime', {chimeMsg: 'The time is now ' + date.toLocaleTimeString() } )
			}
		}, 60000);
		
	}, //postCreate
	
	addMotd: function(line)
	{
		domAttr.set( this.homeDivCenter, 'innerHTML', ( domAttr.get(this.homeDivCenter,'innerHTML') + '<br />' + line ) );
	},
	clearMotd: function()
	{
		domAttr.set( this.homeDivCenter, 'innerHTML', '' );
	},
	
	focusChat: function( data )
	{
		this.tc.selectChild( this.chatManagerPaneId );
	},
	focusDownloads: function()
	{
		this.tc.selectChild( this.downloadManagerPaneId );
	},
	
	
	setNotIdle: function()
	{
		var minutes;
		minutes = 20;
		if( this.idleTimeout !== null )
		{
			clearTimeout( this.idleTimeout );
		}
		if( this.users[ this.nick ].isAway )
		{
			this.users[ this.nick ].setStatusVals( {isAway : false } );
			this.users[ this.nick ].sendStatus();
		}
		
		this.idleTimeout = setTimeout( lang.hitch(this, function(){
			if(!this.users[ this.nick ].isInGame)
			{
				this.users[ this.nick ].setStatusVals( {isAway : true } );
				this.users[ this.nick ].sendStatus();
			}
		}), 60000 * minutes );
	},
	
	
	setupStore: function()
	{
		this.battleListStore = Observable( new Memory({data: [], identifier: 'id'}) );	
	},
	
	joinClanChannel: function()
	{
		var clan;
		
		clan = this.users[this.nick].clan;
		
		if( clan !== '' )
		{
			//this.uberSender( 'JOIN ' + clan ); //server already forces this, as well as planetwars clan
			return;
		}
		
		clan = this.nick.match(/\[([^\]]*)\]/);
		if( clan !== null && clan.length > 1 )
		{
			this.uberSender( 'JOIN ' + clan[1] );
		}
	},
	joinLanguageChannel: function()
	{
		var languageProp;
		var language;
		var country;
		
		languageProp = navigator.language;
		
		if( languageProp )
		{
			languageProp = languageProp.split('-')
			language = languageProp[0];
			country = languageProp[1];
			this.uberSender( 'JOIN ' + language );
		}
	},
	
	addUser: function(name, country, cpu)
	{
		this.users[name] = new User({ name: name, country: country, cpu: cpu });
		
		this.userList.addUser( this.users[name] ); //fixme
		
		this.chatManager.checkUser( name );
		
		if( name === this.nick )
		{
			//this.joinClanChannel(); // do this after user ext instead
			this.joinLanguageChannel();
		}
	},
	remUser: function(name)
	{
		this.userList.removeUser( this.users[name] ); //fixme
		delete this.users[name];
		this.chatManager.checkUser( name );
	},
	
	getIngameTime: function()
	{
		this.uberSender( 'GETINGAMETIME');
	},
	
	makeLoginDialog: function()
	{
		this.nameInput.set( 'value', this.settings.settings.name );
		this.passInput.set( 'value', this.settings.settings.password );
		addDialogToQ( this.loginDialog );
	},
	loginButtonClick: function()
	{
		this.settings.setSetting( 'name', this.nameInput.get( 'value' ) );
		this.settings.setSetting( 'password', this.passInput.get( 'value' ) );
		this.connectToSpring();
		this.loginDialog.hide();
	},
	registerButtonClick: function()
	{
		this.registering = true;
		this.loginButtonClick();
	},
	
	
	makeChangePassDialog: function()
	{
		addDialogToQ( this.changePassDialog );
	},
	changePassButtonClick: function()
	{
		this.uberSender(
			'CHANGEPASSWORD '
			+ this.oldPassInput.get('value')
			+ ' '
			+ this.newPassInput.get('value')
		);
		this.changePassDialog.hide();
	},
	
	makeRenameDialog: function()
	{
		addDialogToQ( this.renameDialog );
	},
	renameButtonClick: function()
	{
		var newName;
		newName = this.renameInput.get( 'value' );
		this.uberSender( 'RENAMEACCOUNT ' + newName );
		this.settings.setSetting( 'name', newName );
		this.disconnect();
		this.connectToSpring();
		this.renameDialog.hide();
	},
	
	
	getHelpContent: function()
	{
		xhr('getversion.suphp', {
			query: {type: 'svn'},
			handleAs: 'text',
			sync: true
		}).then(
			lang.hitch(this, function(data){
				this.weblobbyVersion = data.trim();
				domAttr.set( this.versionSpan, 'innerHTML', data );
				domAttr.set( this.liveVersionSpan, 'innerHTML', data );
			})
		);
		xhr('getversion.suphp', {
			query: {type: 'project'},
			handleAs: 'text',
			sync: true
		}).then(
			lang.hitch(this, function(data){
				domAttr.set( this.projectVersionSpan, 'innerHTML', data );
			})
		);
		
		setInterval(function(thisObj){
			xhr('getversion.suphp', {
				query: {type: 'svn'},
				preventCache: true,
				handleAs: 'text',
			}).then(
				lang.hitch(thisObj, function(data){
					domAttr.set( thisObj.liveVersionSpan, 'innerHTML', data );
				})
			);	
		}, 60000, this);
		
		//return div
	},
	
	
	startup2: function()
	{
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
			this.tc.startup();
			this.battleRoom.startup2();
			this.sBattleRoom.startup2();
			this.chatManager.startup2();
			this.battleManager.startup2();
			this.userList.placeAt(this.homeDivRight);
			this.userList.startup2();		
		}
	},
	
	pingPong: function()
	{
		if( this.authorized )
		{
			if( this.lostPongs >= 3 )
			{
				alert2('Connection lost. Reconnecting...');
				this.lostPongs = 0;
				this.disconnect();
				this.connectToSpring();
			}
			else
			{
				this.uberSender('PING ' + 'swl');
				this.lostPongs++;
			}
		}
	},
	
	agreementAccept: function()
	{
		var accept, htmlText;
		var confirmationDlg
		
		htmlText = convertRTFtoHTML(this.agreementText);
		htmlText = htmlText.replace('\n', '<br />')
		confirmationDlg = new ConfirmationDialog({
			msg: htmlText,
			onConfirm: lang.hitch(this, function(accept)
			{
				if(accept)
				{
					this.uberSender('CONFIRMAGREEMENT');
					this.login();
				}
				else
				{
					this.disconnect();
				}
			})
		});
	},
	
	disconnect: function()
	{
		this.battleManager.empty();
		topic.publish( 'Lobby/chime', {chimeMsg: 'You have been disconnected.'} )
		this.chatManager.connected = false;
		
		this.connectButton.set('label', 'Connect');
		this.connectButton.set('iconClass', 'smallIcon disconnectedImage');
		this.renameButton.set('disabled', true)
		this.ingameTimeButton.set('disabled', true)
		this.changePassButton.set('disabled', true)
		this.connected = false;
		this.authorized = false;
		this.battleRoom.authorized = this.authorized ;
		this.socketDisconnect();
		this.setJugglerState(null);
	},
	
	uberReceiver: function(msg)
	{
		var msg_arr, cmd, channel, channels, message, rest, battleId, battleId,
			i, time, user, battlestatus, status, teamcolor,
			url,
			autoJoinChans,friendsList,
			country, cpu,
			blistStore,
			scriptPassword,
			bot_name,
			inProgress,
			userCount,
			chanTopic,
			allianceId,
			gameHash, ip, port
		;
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		console.log('<TASSERVER> ' + msg);

		this.lostPongs = 0;
		
		/*
		REQUESTUPDATEFILE
		OFFERFILE
		CHANNELMESSAGE
		MUTELIST
		MUTELISTBEGIN
		MUTELISTEND
		JOINBATTLEREQUEST 
		JOINBATTLEACCEPT
		JOINBATTLEDENY
		OPENBATTLEFAILED
		HANDICAP 
		KICKFROMBATTLE
		FORCETEAMNO
		FORCEALLYNO
		FORCETEAMCOLOR
		FORCESPECTATORMODE
		REDIRECT
		USERID 
		< moderators >
		TESTLOGIN 
		*/
		
		if(false){}
		
		else if( cmd === 'ACCEPTED' )
		{
			this.authorized = true;
			this.battleRoom.authorized = this.authorized ;
			this.connectButton.set('label', 'Disconnect');
			this.connectButton.set('iconClass', 'smallIcon connectedImage');
			this.nick = msg_arr[1];	//fixes proper casing.
			topic.publish('SetNick', {nick: this.nick} );
			
			
			//zk frame
			/**/
			if( this.zkFrame )
			{
				var zkurl = '';
				var zkInitUrl = '';
				var loginString = '';
				var month;
				var dateDay;
				var date;
				date = new Date();
				date = new Date( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() )
				month = date.getMonth() + 1;
				month = (month < 10 ? '0' : '') +month ;
				dateDay = (date.getDate() < 10 ? '0' : '') + date.getDate();
				dateString = date.getFullYear() + '-' + month + '-' + dateDay;
				loginString = this.nick + MD5.b64_md5( this.pass ) + dateString
				
				zkurl = 'http://zero-k.info/Missions/?asmallcake='
					+ encodeURIComponent( MD5.b64_md5( loginString ) )
					+ '&alogin=' + this.nick
					+ '&weblobby=' + encodeURIComponent( location.href )
				
				//echo(loginString)
				//echo(zkurl)
				
				zkInitUrl = 'http://zero-k.info/Home/Logon?login='+ this.nick +'&password=' + this.pass
				
				domAttr.set( this.zkInitFrame, 'src', zkInitUrl );
				domAttr.set( this.zkFrame, 'src', zkurl );
			}
			/**/
			
			
			this.chatManager.empty();
			this.chatManager.connected = true;
			
			autoJoinChans = this.settings.settings.autoJoinChannelsList.split('\n');
			array.forEach(autoJoinChans, function(chan){
				this.uberSender( 'JOIN ' + chan.trim() );
			}, this);
			
			friendsList = this.settings.settings.friendsList.split('\n');
			array.forEach(friendsList, function(name){
				if( name !== '' )
				{
					topic.publish('Lobby/chat/addprivchat', {name: name }  );
				}
			}, this);
			
			this.renameButton.set('disabled', null)
			this.changePassButton.set('disabled', null)
			this.ingameTimeButton.set('disabled', null)
			
			this.getSubscriptions();
			this.uberSender('JOIN extension');
			
			this.pingPong();
		}
		else if( cmd === 'ACQUIREUSERID' )
		{
			this.uberSender('USERID ' + this.appletHandler.getUserID() );
		}
		else if( cmd === 'ADDBOT' )
		{
			rest = msg_arr.slice(6).join(' ');
			battleId		= msg_arr[1];
			name			= msg_arr[2];
			owner 			= msg_arr[3];
			battlestatus	= msg_arr[4];
			teamcolor		= msg_arr[5];
			
			bot_name = '<BOT>' + name;
			
			var userCountry = this.users[owner].country;
			
			this.users[bot_name] = new User({ name: name, owner: owner, ai_dll: rest, country: userCountry, battleId: battleId });
			this.users[bot_name].setBattleStatus( battlestatus, teamcolor );
			
			//topic.publish('Lobby/battles/addplayer', { 'name':bot_name, 'battleId':battleId } );
			this.battleRoom.addPlayerByName( bot_name );
			
		}
		else if( cmd === 'ADDSTARTRECT' )
		{
			//this.addStartRect( msg_arr[1], msg_arr[2], msg_arr[3], msg_arr[4], msg_arr[5] );
			this.battleRoom.addStartRect( msg_arr[1], msg_arr[2], msg_arr[3], msg_arr[4], msg_arr[5] );
		}
		else if( cmd === 'ADDUSER' )
		{
			//ADDUSER username country cpu [accountID]
			name 		= msg_arr[1];
			country	 	= msg_arr[2];
			cpu 		= msg_arr[3];
			//accountID	= msg_arr[4];
			this.addUser(name, country, cpu);
		}
		else if( cmd === 'AGREEMENT' )
		{
			rest = msg_arr.slice(1).join(' ');
			this.agreementTextTemp += rest + '\n';
		}
		else if( cmd === 'AGREEMENTEND' )
		{
			this.agreementText = this.agreementTextTemp;
			this.agreementTextTemp = '';
			this.agreementAccept();
		}
		
		else if( cmd === 'BATTLECLOSED' )
		{
			battleId = msg_arr[1];
			this.remBattle( battleId );
		}
		else if( cmd === 'BATTLEOPENED' )
		{
			rest = msg_arr.slice(11).join(' ').split('\t');
			//topic.publish('Lobby/battles/addbattle', {
			this.battleManager.addBattle({
				battleId 	: msg_arr[1],
				type 			: msg_arr[2],
				//nat_type		: msg_arr[3],
				country		: this.users[ msg_arr[4] ].country,
				host			: msg_arr[4],
				ip			: msg_arr[5],
				hostport		: msg_arr[6],
				max_players	: msg_arr[7],
				passworded	: msg_arr[8] === '1',
				rank			: msg_arr[9],
				map_hash		: msg_arr[10],
				map 			: rest[0],
				title			: rest[1],
				game	 		: rest[2],
				progress		: this.users[ msg_arr[4] ].isInGame,
				locked		: false
			} );
			//this.users[ msg_arr[4] ].isHost = true;
			this.users[ msg_arr[4] ].setStatusVals( {
				isHost : true,
				battleId : msg_arr[1]
			} );
		}
		else if( cmd === 'BATTLEOPENEDEX' )
		{
			rest = msg_arr.slice(13).join(' ').split('\t');
			//topic.publish('Lobby/battles/addbattle', {
			this.battleManager.addBattle({
				battleId 		: msg_arr[1],
				type 			: msg_arr[2],
				natType			: msg_arr[3],
				country		: this.users[ msg_arr[4] ].country,
				host			: msg_arr[4],
				ip			: msg_arr[5],
				hostport		: msg_arr[6],
				max_players	: msg_arr[7],
				passworded	: msg_arr[8] === '1',
				rank			: msg_arr[9],
				map_hash		: msg_arr[10],
				
				engineName	: msg_arr[11],
				engineVersion	: msg_arr[12],
				
				
				map 			: rest[0],
				title			: rest[1],
				game	 		: rest[2],
				progress		: this.users[ msg_arr[4] ].isInGame,
				locked		: false
			} );
			//this.users[ msg_arr[4] ].isHost = true;
			this.users[ msg_arr[4] ].setStatusVals( {
				isHost : true,
				battleId : msg_arr[1],
				isInBattle : true
			} );
		}
		
		else if( cmd === 'CHANNEL' )
		{
			channel = msg_arr[1];
			userCount = msg_arr[2];
			chanTopic = msg_arr.slice(3).join(' ');
			topic.publish('Lobby/chat/channels', {channel: channel, userCount: userCount, topic: chanTopic }  )
		}
		
		else if( cmd === 'CHANNELTOPIC' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			time = msg_arr[3];
			message = msg_arr.slice(4).join(' ');
			topic.publish('Lobby/chat/channel/topic', {channel: channel, name: name, msg: message, time: time }  )
		}
		
		else if( cmd === 'CLIENTBATTLESTATUS' )
		{
			name = msg_arr[1];
			battlestatus = msg_arr[2];
			teamcolor = msg_arr[3];
			this.users[name].setBattleStatus( battlestatus, teamcolor );
		}
		
		else if( cmd === 'CLIENTIPPORT' )
		{
			var clientUdpSourcePort
			
			name 				= msg_arr[1];
			ip 					= msg_arr[2];
			clientUdpSourcePort = msg_arr[3];
			
			this.users[name].ip = ip;
			this.users[name].clientUdpSourcePort = clientUdpSourcePort;
			
		}
		else if( cmd === 'CLIENTSTATUS' )
		{
			name = msg_arr[1];
			status = msg_arr[2];
			this.users[name].setStatus(status);
			
			inProgress = this.users[name].isInGame;
			blistStore = this.battleListStore;
			
			var items, item;
			items = blistStore.query({ host: name });
			array.forEach(items, function(curItem){
				item = curItem;
			}, this)
			
			
			if( typeof item !== 'undefined' )
			{
			
				topic.publish('Lobby/battles/updatebattle', {
					battleId: item.id,
					progress: inProgress
				});
			}
		}
		
		else if( cmd === 'CLIENTS' )
		{
			channel = msg_arr[1];
			for(i=2; i < msg_arr.length; i++)
			{
				name = msg_arr[i];
				topic.publish('Lobby/chat/channel/addplayer', {channel: channel, name: name }  )
			}
		}
		
		else if( cmd === 'DENIED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert2('Login Failed. Reason: ' + rest);
			this.disconnect();
			this.makeLoginDialog();
		}
		else if( cmd === 'FORCELEAVECHANNEL' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			rest = msg_arr.slice(3).join(' ');
			alert2('You have been kicked from the channel: ' + name + ' by ' + name + '. Reason: ' + rest );
		}
		else if( cmd === 'FORCEQUITBATTLE' )
		{
			alert2('You are being removed from the battle room.');
		}
		
		else if( cmd === 'HOSTPORT' )
		{
			port = msg_arr[1];
			this.battleRoom.hostPort = port;
		}
		else if( cmd === 'JOIN' )
		{
			channel = msg_arr[1];
			if( channel === 'extension' )
			{
				return;
			}
			topic.publish('Lobby/chat/addroom', {name: channel} )
		}
		else if( cmd === 'JOINED' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			topic.publish('Lobby/chat/channel/addplayer', {channel: channel, name: name, joined: true }  )
		}
		else if( cmd === 'JOINFAILED' )
		{
			channel = msg_arr[1];
			rest = msg_arr.slice(2).join(' ');
			alert2('Failed to join channel "' + channel + '" - ' + rest);
		}
		
		else if( cmd === 'JOINBATTLE' )
		{
			battleId = msg_arr[1];
			gameHash = parseInt( msg_arr[2] );
			//echo("??????? gameHash", msg_arr[2], gameHash)
			this.battleRoom.joinBattle( {battleId: battleId, gameHash: gameHash }  )
		}
		else if( cmd === 'JOINBATTLEFAILED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert2('Failed to join battle - ' + rest)
		}
		else if( cmd === 'JOINEDBATTLE' )
		{
			battleId 		= msg_arr[1];
			name 			= msg_arr[2];
			scriptPassword 	= msg_arr[3];
			//console.log('=========scriptPassword', scriptPassword 	)
			if( typeof scriptPassword === 'undefined' )
			{
				scriptPassword = ''; //placing undefined values in itemfilewritestore (battleplayerlist) causes error when fetching
			}
			//this.generateScript(battleId, name, scriptPassword);
			this.users[ name ].setStatusVals( {
				isInBattle : true,
				battleId : battleId,
				scriptPassword: scriptPassword
			} );
			topic.publish('Lobby/battles/addplayer', {name: name, battleId: battleId, scriptPassword: scriptPassword }  )
			
			
			
		}
		
		else if( cmd === 'LEAVE' )
		{
			channel = msg_arr[1];
			topic.publish('Lobby/chat/remroom', {name: channel} )
		}
		
		else if( cmd === 'LEFT' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			message = msg_arr.slice(3).join(' ');
			topic.publish('Lobby/chat/channel/remplayer', {channel: channel, name: name, msg: message }  )
		}
		else if( cmd === 'LEFTBATTLE' )
		{
			battleId = msg_arr[1];
			name = msg_arr[2];
			topic.publish('Lobby/battles/remplayer', {name: name, battleId: battleId } );
			this.users[ name ].setStatusVals( {isInBattle : false, battleId: '-1' } );
		}
		else if( cmd === 'LOGININFOEND' )
		{
			this.battleManager.postponeUpdateFilters = false;
			this.battleManager.updateFilters();
			this.setNotIdle();
		}
		else if( cmd === 'MOTD' )
		{
			rest = msg_arr.slice(1).join(' ');
			this.addMotd( rest )
		}
		else if( cmd === 'OPENBATTLE' )
		{
			battleId = msg_arr[1];
			
			this.battleRoom.joinBattle( {battleId: battleId, hosting: true }  )
		}
		else if( cmd === 'PONG' )
		{
			this.lostPongs = 0;
		}
		else if( cmd === 'REGISTRATIONACCEPTED' )
		{
			alert2('Registration Successful!')
			this.registering = false;
			this.disconnect();
			this.connectToSpring();
		}
		else if( cmd === 'REGISTRATIONDENIED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert2('Registration Failed. Reason: ' + rest)
			this.disconnect();
			this.registering = false;
			this.makeLoginDialog();
		}
		else if( cmd === 'REMOVEBOT' )
		{
			battleId		= msg_arr[1];
			name			= msg_arr[2];
			
			bot_name = '<BOT>' + name;
			
			//topic.publish('Lobby/battles/remplayer', {'name': bot_name, 'battleId':battleId } );
			this.battleRoom.remPlayerByName( bot_name );
			
			//this.remUser(bot_name); don't call this
			delete this.users[name];
		}
		else if( cmd === 'REMOVESCRIPTTAGS' )
		{
			var scriptTags;
			
			scriptTags = msg_arr.slice(1);
			array.forEach(scriptTags, function(key){
				key = key.toLowerCase();
				
				this.battleRoom.removeScriptTag(key);
				return;
			}, this);
		}
		else if( cmd === 'REMOVESTARTRECT' )
		{
			this.battleRoom.remStartRect(msg_arr[1]);
		}
		else if( cmd === 'REMOVEUSER' )
		{
			//REMOVEUSER username
			name = msg_arr[1];
			this.remUser(name);
		}
		else if( cmd === 'REQUESTBATTLESTATUS' )
		{
			this.battleRoom.finishedBattleStatuses();
		}
		else if( cmd === 'RING' )
		{
			name = msg_arr[1];
			topic.publish('Lobby/battle/ring', {battle: true, name: name } )
		}
		else if( cmd === 'SAID' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(3).join(' ');
			this.said(channel, name, message);
		}
		else if( cmd === 'SAIDEX' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(3).join(' ');
			topic.publish('Lobby/chat/channel/playermessage', {channel: channel, name: name, msg: message, ex: true }  )
		}
		
		else if( cmd === 'SAIDBATTLE' )
		{
			name = msg_arr[1];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(2).join(' ');
			topic.publish('Lobby/battle/playermessage', {battle: true, name: name, msg: message }  )
		}
		else if( cmd === 'SAIDBATTLEEX' )
		{
			name = msg_arr[1];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(2).join(' ');
			topic.publish('Lobby/battle/playermessage', {battle: true, name: name, msg: message, ex: true }  )
		}
		
		else if( cmd === 'SAIDPRIVATE' )
		{
			name = msg_arr[1];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(2).join(' ');
			this.saidPrivate( name, message );
		}
		else if( cmd === 'SAYPRIVATE' )
		{
			
			name = msg_arr[1];
			message = msg_arr.slice(2).join(' ');
			if(
			   ( this.newBattleReady && message.search(/^!spawn/) !== -1 )
			   || ( name === 'Nightwatch' )
			)
			{
				//return;
			}
			else
			{
				topic.publish('Lobby/chat/addprivchat', {name: name }  )
			}
			
			topic.publish('Lobby/chat/user/playermessage', {userWindow: name, name: this.nick, msg: message }  )
		}
		
		else if( cmd === 'SERVERMSG' || cmd === 'BROADCAST' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert2('[ Server Message ]\n' + rest)
		}
		else if( cmd === 'SERVERMSGBOX' )
		{
			rest = msg_arr.slice(1).join(' ');
			url = msg_arr[msg_arr.length-1]
			goToUrl = confirm('[ Server Message ]\n' + rest + '\n\n Proceed to URL?')
			if(goToUrl)
			{
				window.open(url,'_blank');
			}
		}
		else if( cmd === 'SETSCRIPTTAGS' )
		{
			var scriptTags;
			
			scriptTags = msg_arr.slice(1).join(' ').split('\t');
			array.forEach(scriptTags, function(scriptTag){
				var key, val, scriptTagArr;
				
				scriptTagArr = scriptTag.split('=');
				key = scriptTagArr[0];
				val = scriptTagArr[1];
				
				//key = key.toLowerCase();
				//val = val.toLowerCase();
				
				this.battleRoom.setScriptTag(key, val);
			}, this);
		}
		
		
		else if( cmd === 'TASServer' )
		{
			this.serverSpringVer 	= msg_arr[2];
			this.udpPort 			= msg_arr[3];
			this.serverMode 		= msg_arr[4];
			
			this.appletHandler.udpPort = this.udpPort;
			this.appletHandler.server = this.url;
			
			this.battleRoom.serverEngineVersion = this.serverSpringVer;
			if(this.registering)
			{
				this.uberSender('REGISTER '+ this.settings.settings.name + ' ' + MD5.b64_md5( this.settings.settings.password ) )
			}
			else
			{
				this.clearMotd();
				domAttr.set( this.homeDivCenter, 'innerHTML', '<b>MOTD</b>' );
				this.addMotd( '<b>Server Version: ' +  msg_arr[1] +'</b>' );
				this.addMotd( '<b>Server Spring Version: ' + this.serverSpringVer +'</b>' );
				
				this.login();
			}
		}
		else if( cmd === 'UDPSOURCEPORT' )
		{
			var udpSourcePort = msg_arr[1];
			this.udpSourcePort = udpSourcePort;
		}
		else if( cmd === 'UPDATEBATTLEINFO' )
		{
			battleId = msg_arr[1];
			topic.publish('Lobby/battles/updatebattle', {
				battleId 	: battleId,
				spectators 	: msg_arr[2],
				locked 		: msg_arr[3] === '1',
				map_hash 		: msg_arr[4],
				//'map' 			: msg_arr.slice(5).join(' ').split('\t')
				map 			: msg_arr.slice(5).join(' ')
			});
		}
		else if( cmd === 'UPDATEBOT' )
		{
			battleId		= msg_arr[1];
			name			= msg_arr[2];
			battlestatus	= msg_arr[3];
			teamcolor		= msg_arr[4];
			bot_name = '<BOT>'+name;
			this.users[bot_name].setBattleStatus( battlestatus, teamcolor );
		}
		
	},//uberReceiver
	
	remBattle: function(battleId)
	{
		var battle;
		battle = this.battleListStore.get(battleId);
		if( typeof battle !== 'undefined' )
		{
			this.users[ battle.host ].setStatusVals( {isHost : false } );
			
			//in case the battle was closed, there are no LEFTBATTLE triggers for the existing players.
			var playerlist, player_name;
			playerlist = battle.playerlist;
			for(player_name in playerlist)
			{
				this.users[ player_name ].setStatusVals( {isInBattle : false, battleId: '-1' } );
			}
			
			this.battleListStore.remove(battleId);
		}
		if( this.battleRoom.battleId === battleId )
		{
			alert2('The battleroom was closed.');
			this.battleRoom.closeBattle();
		}
		
		this.battleManager.removeBattle();
	},
	
	said: function(channel, name, message)
	{
		var jsonCmd, jsonString, json;
		if(channel === 'extension')
		{
			if( message.search(/^!JSON /) === 0 )
			{
				message = message.split(' ');
				jsonCmd = message[1];
				jsonString = message.slice(2).join(' ');
				json = eval( '(' + jsonString + ')' );
				if( jsonCmd === 'JugglerState' )
				{
					this.setJugglerState( json );
				}
			}
			else if( message.search(/^USER_EXT /) === 0 )
			{
				this.processUserExt( message );
			}
			return;
		}
		topic.publish('Lobby/chat/channel/playermessage', {channel: channel, name: name, msg: message }  );
	},
	ignoreName: function(name)
	{
		var ignoreList
		ignoreList = this.settings.settings.ignoreList.split('\n');
		return array.indexOf( ignoreList, name ) !== -1;
	},
	saidPrivate: function(name, message)
	{
		var backlogData, channel, channels, time, battleId, jsonCmd, jsonString, json, hostName, elo, userName;
		if( name === 'Nightwatch' )
		{
			topic.publish('Lobby/chat/user/playermessage', {userWindow: name, name: name, msg: message }  );
			if( message.search(/^!pm\|/) === 0 )
			{
				backlogData = message.split('|')
				channel = backlogData[1];
				name = backlogData[2];
				time = backlogData[3];
				message = backlogData.slice(4).join('|');
				if( channel === '' )
				{
					topic.publish('Lobby/chat/addprivchat', {name: name, msg: message }  )
					topic.publish('Lobby/chat/user/playermessage', { userWindow: name, name: name, msg: message, time: time }  )
				}
				else
				{
					topic.publish('Lobby/chat/channel/playermessage', {channel: channel, name: name, msg: message, time: time }  )
				}
				//return;
			}
			else if( message.search(/^Subscribed to:/) === 0 )
			{
				message = message.replace( 'Subscribed to:', '' );
				message = message.replace(/ /g, '');
				channels = message.split(',');
				this.chatManager.subscribedChannels = channels;
				array.forEach( channels, function(channel){
					topic.publish('Lobby/chat/channel/subscribe', { name: channel, subscribed: true }  )
				} );
				//return;
			}
			else if( message.search(/^!JSON /) === 0 )
			{
				message = message.split(' ');
				jsonCmd = message[1];
				jsonString = message.slice(2).join(' ');
				json = eval( '(' + jsonString + ')' );
				if( jsonCmd === 'JugglerConfig' )
				{
					this.setJugglerConfig( json );
				}
				else if( jsonCmd === 'JugglerState' )
				{
					this.setJugglerState( json );
				}
				else if( jsonCmd === 'SiteToLobbyCommand' )
				{
					topic.publish( 'Lobby/mission', json );
				}
			}
			else if( message.search(/^USER_EXT /) === 0 )
			{
				this.processUserExt(message);
			}
			
			return;
		}
		
		else if( this.newBattleReady && message === "I'm here! Ready to serve you! Join me!" )
		{
			this.newBattleReady = false;
			battleId = this.users[name].battleId;
			this.battleManager.joinBattle( battleId, this.newBattlePassword );
			return;
		}
		topic.publish('Lobby/chat/addprivchat', {name: name, msg: message }  );
		topic.publish('Lobby/chat/user/playermessage', {userWindow: name, name: name, msg: message }  );
	},
	
	processUserExt: function( message )
	{
		var userName;
		userName = message.split(' ')[1];
		this.setUserExt( userName, message, 'EffectiveElo', 'elo' );
		this.setUserExt( userName, message, 'Avatar', 'avatar' );
		this.setUserExt( userName, message, 'Clan', 'clan' );
		if( userName === this.nick )
		{
			this.joinClanChannel();
		}
		if( userName in this.users )
		{
			topic.publish( 'Lobby/updateUser', this.users[userName] );
			//todo: this only sends to userlist, send to battleplayerlist as well.
		}
	},
	
	setJugglerConfig: function( config )
	{
		this.juggler.config = config;
		
		this.battleManager.setQuickMatchButton( config.Active )
	},
	setJugglerState: function(state)
	{
		this.juggler.state = state;
	},
	
	getSubscriptions: function()
	{
		this.uberSender('SAYPRIVATE Nightwatch !listsubscriptions');
	},
	
	setUserExt: function( userName, message, userExtVal, userVal )
	{
		var val
		userName = message.split(' ')[1];
		val = message.match( new RegExp( '\\|' + userExtVal + '\\|([^\\|]*)\\|') )
		if( val !== null )
		{
			val = val[1];
			if( typeof this.users[userName] !== 'undefined' )
			{
				this.users[userName][userVal] = val;
			}
		}
	},
				
				
	
	//connection
	uberSender: function(message)
	{
		console.log( "<LOCAL> " + message );
		if(this.connected)
		{
			this.socketSend( message );
		}
	},
	
	login: function ()
	{	
		var message, compatFlags, osCpuHack;
		this.nick = this.settings.settings.name;
		this.pass = this.settings.settings.password;
		topic.publish('SetNick', {nick: this.nick} )
		compatFlags = 'eb';
		osCpuHack = ({
			Windows: '7777',
			Linux: '7778',
			Linux64: '7778',
			Mac: '7779'
		})[this.os]
		if( osCpuHack === null || typeof osCpuHack === 'undefined' )
		{
			alert('OS not found');
			osCpuHack = '7777';
		}
		//message = 'LOGIN ' + this.nick + ' ' + MD5.b64_md5( this.pass ) + ' ' + osCpuHack + ' * SpringWebLobby 0.0001' + '\t' + 0 + '\t' + compatFlags;
		message = 'LOGIN ' + this.nick + ' ' + MD5.b64_md5( this.pass ) + ' ' + osCpuHack + ' * SpringWebLobby ' + this.weblobbyVersion + '\t' + this.appletHandler.getUserID() + '\t' + compatFlags;
		this.uberSender(message)
	},
	
	connectButtonPush: function()
	{
		if( this.settings.settings.name === '' || this.settings.settings.password === ''  )
		{
			this.makeLoginDialog();
			return;
		}
		
		if(this.connected)
		{
			//this.tc.destroyDescendants();
			this.disconnect();
		}
		else
		{
			this.connectToSpring();
		}
	},
	
	connectToSpring: function()
	{
		this.battleRoom.closeBattle();
		this.socketConnect(this.url, this.port);
		this.connected = true;
		this.connectButton.set('label', 'Connecting...');
		this.connectButton.set('iconClass', 'smallIcon connectingImage');
		topic.publish('Lobby/connecting', {})
	},
	
	// Connect to a given url and port
	socketConnect: function (url, port)
	{
		this.getSocketBridge().connect(url, port);
	},
	
	// Disconnect
	socketDisconnect: function ()
	{
		this.getSocketBridge().disconnect();
	},
	
	// Write something to the socket
	socketSend: function (message)
	{
		this.getSocketBridge().send(message);
	},
	
	setIsInGame: function(inGame)
	{
		//if you're not logged in but start a single player game.
		if( !( this.nick in this.users ) )
		{
			return; 
		}
		this.users[ this.nick ].setStatusVals( {isInGame : inGame } );
		this.users[ this.nick ].sendStatus();
		
		topic.publish('Lobby/setAllowNotifySound', !inGame);
	},
	
	// Report an error
	onSocketError: function (message)
	{
		alert2(message);
	},
	
	// Get the applet object
	getSocketBridge: function()
	{
		return this.appletHandler.getSocketBridge();
	},
	
	reAddOptionsToSelect: function( select, options )
	{
		select.removeOption(select.getOptions());
		array.forEach( options, function(option){
			select.addOption(option)
		});
	},
	
	makeReplayDialog: function()
	{
		var replayFiles
		var engineVersions
		var engineOptions
		var replayOptions
		
		engineVersions = this.appletHandler.getEngineVersions();
		engineOptions = [];
		array.forEach( engineVersions, function(engineVersion){
			engineOptions.push( { label: engineVersion, value: engineVersion} )
		});
		engineOptions.reverse();
		this.reAddOptionsToSelect(this.engineSelect, engineOptions);
		
		
		replayFiles = this.appletHandler.getReplays()
		replayOptions = [];
		array.forEach( replayFiles, function(replayFileName){
			replayOptions.push( { name: replayFileName, id: replayFileName } )
		}, this);
		this.replaySelect.set( 'autoComplete', false );
		this.replaySelect.set( 'queryExpr', '*${0}*' );
		//this.replaySelect.set( 'highlightMatch', 'all' );
		this.replaySelect.set( 'store', new Memory({ data: replayOptions }) )
		
		this.replayDialog.show();
	},
	
	startReplayButtonClick: function()
	{
		this.appletHandler.startSpringReplay( this.replaySelect.get('value'), this.engineSelect.get('value') );
	},
	
	blank: null
}); }); //declare lwidgets.Lobby


