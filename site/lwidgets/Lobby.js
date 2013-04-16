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
		'dojo/request',
		'dojo/on',
		'dojo/Deferred',
		'dojo/_base/unload',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dijit/Dialog',
		'dijit/form/Button',
		
		// *** extras ***
		
		'dojo/text', 
		
		'dijit/layout/BorderContainer',
		'dijit/layout/TabContainer',
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		
		
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
			request, on,
			Deferred,
			baseUnload,
			
			Memory,
			Observable,
			
			Dialog,
			Button
	){


declare("AppletHandler", [ ], {
	
	'modList':null,
	
	'settings':null,
	'path':'',
	
	'os':'',
	'slash':'/',
	'commandStreamOut':null,
	'version':0,
	'unitSyncs':null,
	'springHome':'',
	
	'constructor':function(args)
	{
		var i;
		declare.safeMixin(this, args);
		this.commandStreamOut = [];
		this.modList = [];
		this.springHome = document.WeblobbyApplet.getSpringHome();
		topic.subscribe('Lobby/commandStream', lang.hitch( this, 'commandStream') );
		this.downloadDownloader()
		if( this.os === 'Windows' )
		{
			this.slash = '\\';
		}
		this.unitSyncs = {};
	},
	
	'createDir':function(dir)
	{
		document.WeblobbyApplet.createDir(dir);
	},
	
	'listDirs':function(path)
	{
		var dirs;
		dirs = document.WeblobbyApplet.listDirs(path).split('||');
		if( dirs.length === 1 && dirs[0] === '' )
		{
			dirs = [];
		}
		return dirs;
	},
	
	'getEngineVersions':function()
	{
		return this.listDirs( this.springHome + '/weblobby/engine')
	},
	
	'refreshUnitsync':function(version) //fixme: prevent thrashing
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
		}
		else
		{
			for( curVersion in this.unitSyncs )
			{
				this.refreshUnitsync(curVersion);
			}
			
		}
		topic.publish('Lobby/unitsyncRefreshed');
	},

	'startSpringSettings':function(version)
	{
		var springCommand, springCfg;
		springCfg = this.getEngineCfg(version);
		springCommand = this.getEngineExec(version);
		document.WeblobbyApplet.deleteSpringSettings( springCfg );
		this.getUnitsync(version).setSpringConfigString('SpringData', this.springHome );
		this.lobby.setIsInGame(true)
		this.runCommand('spring',[ springCommand ]);
	},
	
	'startSpring':function(script, version)
	{
		var springCommand;
		var scriptFile;
		var uikeysFile;
		var springCfg;
		var cmdArray;
		springCommand = this.getEngineExec(version);
		scriptFile = this.springHome + '/weblobby/script.spring'
		springCfg = this.getEngineCfg(version);
		uikeysFile = this.getEnginePath(version) + '/uikeys.txt' ;
		
		document.WeblobbyApplet.createScript( scriptFile, script );
		document.WeblobbyApplet.deleteSpringSettings( springCfg );
		document.WeblobbyApplet.createUiKeys( uikeysFile );
		
		cmdArray = [ springCommand, scriptFile ];
		if( this.settings.settings.springSafeMode )
		{
			cmdArray = [ springCommand, '--safemode', scriptFile ];
		}
		
		if( this.settings.settings.springPrefix !== '' )
		{
			cmdArray.unshift(this.settings.settings.springPrefix)
		}
		
		this.lobby.setIsInGame(true)
		this.runCommand('spring', cmdArray );
		
	},
	
	//cmdName must not contain slashes or single quotes.
	'runCommand':function(cmdName, cmds)
	{		
		this.commandStreamOut = [];
		setTimeout( function(cmdName, cmds2){
			document.WeblobbyApplet.runCommand(cmdName, cmds);
		}, 1, cmdName, cmds );
		
	},
	
	'killCommand': function( processName )
	{
		setTimeout( function(processName){
			document.WeblobbyApplet.killCommand( processName );
		}, 1, processName );
	},
	
	'commandStream':function(data)
	{
		var noDownloadMatch;
		var exitingCommand;
		if( data.cmdName === 'exit' )
		{
			exitingCommand = data.line;
			if( exitingCommand === 'spring' )
			{
				this.lobby.setIsInGame(false)
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
	
	'downloadDownloader':function()
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
		
		if( typeof document.WeblobbyApplet.downloadFile !== 'function' )
		{
			alert2('Java applet failed to load. Please make sure you installed java and enabled it in your browser.')
			return;
		}
		this.javaLoaded = true;
		
		array.forEach( files, function(file) {
			document.WeblobbyApplet.downloadFile(
				location.href.replace(/\/[^\/]*$/, '') + '/pr-downloader/' + this.os.toLowerCase() + '/' + file,
				targetPath + file
			);
		}, this);
		
	},
	
	'getEnginePath':function(version)
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
	
	'getEngineExec':function(version)
	{
		return this.getEnginePath(version) + this.slash + 'spring';
	},
	'getEngineCfg':function(version)
	{
		return this.getEnginePath(version) + this.slash + 'springsettings.cfg';
	},
	
	'getUnitSyncPath':function(version)
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
	
	'getUnitsync':function(version)
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
	'initOnce':false,
	'loadUnitsync':function(version)
	{
		var unitSync, path;
		path = this.getUnitSyncPath(version);
		
		/**/
		//echo('loadUnitsync', path)
		unitSync = document.WeblobbyApplet.getUnitsync(path);
		
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
				//this.refreshUnitsync(version);
			}
			catch(e)
			{
				console.log('unitsync init exception!', e);
				alert2('The applet may have exited unexpectedly. You will need to reload the page.' );
			}
			topic.publish('Lobby/unitsyncRefreshed');
		}
		else
		{
			this.downloadManager.downloadEngine(version);
		}
		
	},
	
	'jsReadFileVFS':function(fd, size, version)
	{
		var path;
		path = this.getUnitSyncPath(version);
		try
		{
			return document.WeblobbyApplet.jsReadFileVFS(path, fd, size );
		}
		catch( e )
		{
			alert2('There was a problem accessing Spring. Please check that: \n- Java is enabled. \n- Your path to Spring in the settings tab is correct. \n\nYou will need to reload the page.');
		}
		return '';
		
	},
	
	//console.log( "TEST2: " + this.getWeblobbyApplet().getSpringVersion() );
	
	'blank':null
});//declare UnitSync


return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	'pingPongTime':60000,
	'gotPong':true,
	
	'nick':'',
	'password':'',
	'url' : 'springrts.com',
	'port' : '8200',
	'agreementTextTemp':'',
	'agreementText':'',
	'serverSpringVer':'',
	'localSpringVer':'',
	'serverClientVer':'',
	'localClientVer':'',
	
	'udpPort':'',
	'serverMode':'',
	
	'widgetsInTemplate':true,
	'connected' : false,
	'authorized' : false,
	'registering':false,
	'startMeUp':true,
	
	'tc':null,
	'mainContainer':null,
	'connectButton':null,
	'battleRoom':null,
	'sBattleRoom':null,
	'battleManager':null,
	'userList':null,
	'settings':null,
	'renameButton':null,
	'changePassButton':null,
	'users':null,
	
	'battleListStore':null,
	'battleList':null,
	
	'juggler':null,
	
	'appletHandler':null,
	
	'javaLoaded':false,
	
	'idleTimeout':null,
	
	'newBattleReady':false,
	'newBattlePassword':'',
	
	'versionNum': '',
	//'versionSpan':null,
	
	'downloadManagerPaneId':'??', 
	'chatManagerPaneId':'??',
	'scriptPassword':'',
	
	//'constructor':function(){},
	
	'templateString' : template,
	
	'ResizeNeeded':function()
	{
		topic.publish('ResizeNeeded', {} );
		this.userList.resizeAlready();
	},
	
	'onLinux64':function()
	{
		return ( navigator.oscpu === 'Linux x86_64' || navigator.platform === 'Linux x86_64' ) 
	},
	
	'postCreate' : function()
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
		
		this.appletHandler = new AppletHandler( {'settings':this.settings, 'os':this.os, 'lobby':this } )
		
		if( !this.appletHandler.javaLoaded )
		{
			return;
		}
		
		this.downloadManager = new DownloadManager( {'settings':this.settings, 'appletHandler':this.appletHandler, 'os':this.os } );
		
		this.appletHandler.downloadManager = this.downloadManager;
		this.settings.appletHandler = this.appletHandler;
		
		this.downloadManagerPane.set('content', this.downloadManager );
		this.chatManager = new ChatManager( {'settings':this.settings, 'users':this.users } );
		this.chatManagerPane.set('content', this.chatManager );
		this.battleManager = new BattleManager( { 'store':this.battleListStore, 'scriptPassword':this.scriptPassword, 'users':this.users } );
		this.battleManagerPane.set('content', this.battleManager );
		//this.helpPane.set('content', this.getHelpContent() );
		this.getHelpContent();
		this.battleRoom = new MBattleRoom( {
			'settings':this.settings,
			'nick':this.nick,
			'users':this.users,
			'appletHandler':this.appletHandler,
			'downloadManager':this.downloadManager,
			'battleListStore':this.battleListStore,
			'scriptPassword':this.scriptPassword
		} );
		this.bottomPane.set('content', this.battleRoom );
		
		var localUsers, localMe, localName;
		localName = this.settings.settings.name;
		if( localName === '' )
		{
			localName = 'NoName';
		}
		localUsers = {}
		localMe = new User({
			'name':localName,
			'cpu':'123',
			'country':'unknown',
			'battleId':-1,
			'rank':0,
			'local':true
		});
		//localMe = new User({ 'name':'invalid', 'cpu':'123', 'country':'unknown', battleId:-1, 'rank':0 });
		localMe.setStatusVals({
			'isReady':true,
			'isSpectator':true,
			'allyNumber':0,
			'teamNumber':0,
			'syncStatus':'Synced'
		});
		localUsers[localName] = localMe;
		this.sBattleRoom = new SBattleRoom( {
			'local':true,
			'settings':this.settings,
			'nick':localName,
			'users':localUsers,
			'appletHandler':this.appletHandler,
			'downloadManager':this.downloadManager,
			'battleListStore':this.battleListStore, //remove
			//'scriptPassword':this.scriptPassword //remove
		} );
		this.singlePane.set('content', this.sBattleRoom );
		
		
		this.userList = new UserList({'name':'server list'});
		this.juggler = new Juggler({});
		
		
		this.subscribe('Lobby/receive', function(data){ this.uberReceiver(data.msg) });
		this.subscribe('Lobby/rawmsg', function(data){ this.uberSender(data.msg) });
		this.subscribe('Lobby/notidle', 'setNotIdle');
		this.subscribe('Lobby/makebattle', 'makeBattle');
		this.subscribe('Lobby/focuschat', 'focusChat');
		this.subscribe('Lobby/focusDownloads', 'focusDownloads');
		
		baseUnload.addOnUnload( lang.hitch(this, 'disconnect') );
		
		this.downloadManagerPaneId = this.downloadManagerPane.id; 
		this.chatManagerPaneId = this.chatManagerPane.id; 
		
		
		this.chatManagerPane.on( 'show', lang.hitch( this, function(){ this.chatManager.resizeAlready();  } ) );
		
		
		setInterval( function(thisObj){ thisObj.pingPong(); }, this.pingPongTime, this );
		setInterval( function(){
			date = new Date;
			if( date.getMinutes() === 0 )
			{
				topic.publish( 'Lobby/chime', {'chimeMsg':'The time is now ' + date.toLocaleTimeString() } )
			}
		}, 60000);
		
		/** /
		this.mapsPane.on('show', lang.hitch(this, function(){
			win.withDoc(this.mapsFrame.contentWindow.document, function(){
			  //var someDiv = query("someDiv");
			  //style.set(someDiv, "color", "red");
			  mapLinks = query('a[href^=spring]')
			  console.log(mapLinks);
			}, this);
		}))
		/**/
		
	}, //postCreate
	
	'addMotd':function(line)
	{
		domAttr.set( this.homeDivCenter, 'innerHTML', ( domAttr.get(this.homeDivCenter,'innerHTML') + '<br />' + line ) );
	},
	'clearMotd':function()
	{
		domAttr.set( this.homeDivCenter, 'innerHTML', '' );
	},
	
	'focusChat':function( data )
	{
		this.tc.selectChild( this.chatManagerPaneId );
	},
	'focusDownloads':function()
	{
		this.tc.selectChild( this.downloadManagerPaneId );
	},
	
	'cmpbrAdvancedToggle':function()
	{
		var showingAdvanced;
		showingAdvanced = domStyle.get( this.cmpbrAdvanced, 'display' ) === 'block';
		domStyle.set( this.cmpbrAdvanced, 'display', showingAdvanced ? 'none' : 'block');
		this.cmpbrAdvancedButton.set('label', (showingAdvanced ? 'Show' : 'Hide') + ' Advanced Options');
	},
	'cmpbrUpdateRapidTag':function(val)
	{
		this.cmpbrRapidTag.set( 'value', val );
	},
	'cmpbrCreateGame':function()
	{
		var smsg, springie, foundSpringie, i;
		
		this.newBattleReady = true;
		this.newBattlePassword = this.cmpbrPassword.value;
		i = 0;
		while( !foundSpringie && i < 100 )
		{
			springie = 'Springiee' + (i===0 ? '' : i);
			if( springie in this.users )
			{
				foundSpringie = true
				smsg = 'SAYPRIVATE '+springie+' !spawn mod='+ this.cmpbrRapidTag.value +',title='+ this.cmpbrName.value +',password=' + this.newBattlePassword;
				topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
			}
			i += 1;
		}
		this.cmpbrDialog.hide();
	
	},
	'makeBattle':function()
	{
		var dlg, nameInput, passInput, gameSelect, dlgDiv, goButton, rapidGames;
		
		if( !this.authorized )
		{
			alert2('Please connect to the server first before creating a multiplayer battle.');
			return;
		}
		this.cmpbrDialog.show();
		this.cmpbrName.set( 'value', this.nick + '\'s Game!' );
	},
	
	'setNotIdle':function()
	{
		var minutes;
		minutes = 20;
		if( this.idleTimeout !== null )
		{
			clearTimeout( this.idleTimeout );
			if( this.users[ this.nick ].isAway )
			{
				this.users[ this.nick ].setStatusVals( {'isAway' : false } );
				this.users[ this.nick ].sendStatus();
			}
		}
		
		this.idleTimeout = setInterval( function(thisObj){
			thisObj.users[ thisObj.nick ].setStatusVals( {'isAway' : true } );
			thisObj.users[ thisObj.nick ].sendStatus();
		}, 60000 * minutes, this );
	},
	
	
	'setupStore':function()
	{
		this.battleListStore = Observable( new Memory({data:[], identifier:'id'}) );	
	},
	
	
	'addUser':function(name, country, cpu)
	{
		var clan;
		this.users[name] = new User({ 'name':name, 'country':country, 'cpu':cpu });
		
		this.userList.addUser( this.users[name] ); //fixme
		
		if( name === this.nick )
		{
			//this.uberSender( 'JOIN ' + this.users[name].country );
			clan = name.match(/\[([^\]]*)\]/);
			//if( typeof clan !== 'null' && clan.length > 1 )
			if( clan !== null && clan.length > 1 )
			{
				this.uberSender( 'JOIN ' + clan[1] );
			}
		}
	},
	'remUser':function(name)
	{
		this.userList.removeUser( this.users[name] ); //fixme
		delete this.users[name];
	},
	
	'makeLoginDialog':function()
	{
		var dlg, nameInput, passInput, dlgDiv, regButton, loginButton;
		dlgDiv = domConstruct.create( 'div', {} );
		
		domConstruct.create('span',{'innerHTML':'Name '}, dlgDiv )
		nameInput = domConstruct.create( 'input', {'type':'text', 'value':this.settings.settings.name }, dlgDiv );
		domConstruct.create('br',{}, dlgDiv )
		
		domConstruct.create('span',{'innerHTML':'Password '}, dlgDiv )
		passInput = domConstruct.create( 'input', {'type':'password', 'value':this.settings.settings.password }, dlgDiv );
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		dlg = new Dialog({
            'title': "Log In or Register a New Account",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		loginButton = new Button({
			'label':'Log in',
			'onClick':lang.hitch(this, function(){
				this.settings.setSetting( 'name', domAttr.get(nameInput, 'value') );
				this.settings.setSetting( 'password', domAttr.get(passInput, 'value') );
				this.connectToSpring();
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		regButton = new Button({
			'label':'Register',
			'onClick':lang.hitch(this, function(){
				this.registering = true;
				this.settings.setSetting( 'name', domAttr.get(nameInput, 'value') );
				this.settings.setSetting( 'password', domAttr.get(passInput, 'value') );
				this.connectToSpring();
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	
	'makeChangePassDialog':function()
	{
		var dlg, oldPassInput, newPassInput, dlgDiv, goButton;
		dlgDiv = domConstruct.create( 'div', {} );
		
		domConstruct.create('span',{'innerHTML':'Old Password '}, dlgDiv )
		oldPassInput = domConstruct.create( 'input', {'type':'password'}, dlgDiv );
		domConstruct.create('br',{}, dlgDiv )
		
		domConstruct.create('span',{'innerHTML':'New Password '}, dlgDiv )
		newPassInput = domConstruct.create( 'input', {'type':'password'}, dlgDiv );
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		dlg = new Dialog({
            'title': "Change Your Password",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new Button({
			'label':'Change Password',
			'onClick':lang.hitch(this, function(){
				this.uberSender(
					'CHANGEPASSWORD '
					+ domAttr.get(oldPassInput, 'value')
					+ ' '
					+ domAttr.get(newPassInput, 'value')
				);
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	
	'makeRenameDialog':function()
	{
		var dlg, nameInput, dlgDiv, goButton;
		dlgDiv = domConstruct.create( 'div', {} );
		
		domConstruct.create('span',{'innerHTML':'New Name '}, dlgDiv )
		nameInput = domConstruct.create( 'input', {'type':'text'}, dlgDiv );
		domConstruct.create('br',{}, dlgDiv )
		domConstruct.create('br',{}, dlgDiv )
		
		dlg = new Dialog({
            'title': "Rename Your Account",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new Button({
			'label':'Rename (will reconnect)',
			'onClick':lang.hitch(this, function(){
				var newName;
				newName = domAttr.get(nameInput, 'value');
				this.uberSender( 'RENAMEACCOUNT ' + newName );
				this.settings.setSetting( 'name', newName );
				this.disconnect();
				this.connectToSpring();
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	
	'getHelpContent':function()
	{
		request.post('getversion.suphp', {
			//data:data,
			handleAs:'text',
			sync:true
		}).then(
			lang.hitch(this, function(data){
				this.serverClientVer = data;
				domAttr.set( this.versionSpan, 'innerHTML', data );
			})
		);
		//return div
	},
	
	
	'startup2':function()
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
	
	'pingPong':function()
	{
		if( this.authorized )
		{
			if( !this.gotPong )
			{
				alert2('Connection lost.');
				this.gotPong = true;
				this.disconnect();
				return;
			}
			this.uberSender('PING ' + 'swl');
			this.gotPong = false;
		}
	},
	
	'agreementAccept':function()
	{
		var accept, htmlText;
		var confirmationDlg
		
		htmlText = convertRTFtoHTML(this.agreementText);
		htmlText = htmlText.replace('\n', '<br />')
		confirmationDlg = new ConfirmationDialog({
			'msg':htmlText,
			'onConfirm':lang.hitch(this, function(accept)
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
	
	'disconnect':function()
	{
		var items;
		items = this.battleListStore.query({'id': new RegExp('.*') });
		array.forEach(items, function(item){
			this.battleListStore.remove(item.id)
		}, this)
		
		topic.publish( 'Lobby/chime', {'chimeMsg':'You have been disconnected.'} )
		
		this.connectButton.set('label', 'Connect');
		this.connectButton.set('iconClass', 'smallIcon disconnectedImage');
		this.renameButton.set('disabled', true)
		this.changePassButton.set('disabled', true)
		this.connected = false;
		this.authorized = false;
		this.socketDisconnect();
		this.setJugglerState(null);
	},
	
	'uberReceiver':function(msg)
	{
		var msg_arr, cmd, channel, channels, message, rest, battleId, battleId,
			i, time, user, battlestatus, status, teamcolor,
			url,
			autoJoinChans,
			country, cpu,
			blistStore,
			scriptPassword,
			bot_name,
			inProgress,
			userCount,
			chanTopic,
			allianceId,
			gameHash
		;
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		console.log('<TASSERVER> ' + msg);
		
		/*
		REQUESTUPDATEFILE
		OFFERFILE
		UDPSOURCEPORT
		CLIENTIPPORT
		HOSTPORT 
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
		ACQUIREUSERID
		USERID 
		< moderators >
		FORCELEAVECHANNEL
		TESTLOGIN 
		*/
		
		if(false){}
		
		else if( cmd === 'ACCEPTED' )
		{
			this.authorized = true;
			this.connectButton.set('label', 'Disconnect');
			this.connectButton.set('iconClass', 'smallIcon connectedImage');
			this.nick = msg_arr[1];	//fixes proper casing.
			topic.publish('SetNick', {'nick':this.nick} )
			
			this.chatManager.empty();
			
			autoJoinChans = this.settings.settings.autoJoinChannelsList.split('\n');
			array.forEach(autoJoinChans, function(chan){
				this.uberSender( 'JOIN ' + chan.trim() );
			}, this);
			
			this.renameButton.set('disabled', null)
			this.changePassButton.set('disabled', null)
			
			this.getSubscriptions();
			this.uberSender('JOIN extension');
			
			//doesn't seem to work.
			//this.battleManager.grid.beginUpdate();  
			//this.userList.grid.beginUpdate();
			
			this.pingPong();
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
			
			this.users[bot_name] = new User({ 'name':name, 'owner':owner, 'ai_dll':rest, 'country':userCountry, 'battleId':battleId });
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
				'battleId' 	: msg_arr[1],
				'type' 			: msg_arr[2],
				//nat_type		: msg_arr[3],
				'country'		: this.users[ msg_arr[4] ].country,
				'host'			: msg_arr[4],
				'ip'			: msg_arr[5],
				'hostport'		: msg_arr[6],
				'max_players'	: msg_arr[7],
				'passworded'	: msg_arr[8] === '1',
				'rank'			: msg_arr[9],
				'map_hash'		: msg_arr[10],
				'map' 			: rest[0],
				'title'			: rest[1],
				'game'	 		: rest[2],
				'progress'		: this.users[ msg_arr[4] ].isInGame,
				'locked'		: '0'
			} );
			//this.users[ msg_arr[4] ].isHost = true;
			this.users[ msg_arr[4] ].setStatusVals( {
				'isHost' : true,
				'battleId' : msg_arr[1]
			} );
		}
		else if( cmd === 'BATTLEOPENEDEX' )
		{
			rest = msg_arr.slice(13).join(' ').split('\t');
			//topic.publish('Lobby/battles/addbattle', {
			this.battleManager.addBattle({
				'battleId' 		: msg_arr[1],
				'type' 			: msg_arr[2],
				//nat_type		: msg_arr[3],
				'country'		: this.users[ msg_arr[4] ].country,
				'host'			: msg_arr[4],
				'ip'			: msg_arr[5],
				'hostport'		: msg_arr[6],
				'max_players'	: msg_arr[7],
				'passworded'	: msg_arr[8] === '1',
				'rank'			: msg_arr[9],
				'map_hash'		: msg_arr[10],
				
				'engineName'	: msg_arr[11],
				'engineVersion'	: msg_arr[12],
				
				
				'map' 			: rest[0],
				'title'			: rest[1],
				'game'	 		: rest[2],
				'progress'		: this.users[ msg_arr[4] ].isInGame,
				'locked'		: '0'
			} );
			//this.users[ msg_arr[4] ].isHost = true;
			this.users[ msg_arr[4] ].setStatusVals( {
				'isHost' : true,
				'battleId' : msg_arr[1]
			} );
		}
		
		else if( cmd === 'CHANNEL' )
		{
			channel = msg_arr[1];
			userCount = msg_arr[2];
			chanTopic = msg_arr.slice(3).join(' ');
			topic.publish('Lobby/chat/channels', {'channel':channel, 'userCount':userCount, 'topic':chanTopic }  )
		}
		
		else if( cmd === 'CHANNELTOPIC' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			time = msg_arr[3];
			message = msg_arr.slice(4).join(' ');
			topic.publish('Lobby/chat/channel/topic', {'channel':channel, 'name':name, 'msg':message, 'time':time }  )
		}
		
		else if( cmd === 'CLIENTBATTLESTATUS' )
		{
			name = msg_arr[1];
			battlestatus = msg_arr[2];
			teamcolor = msg_arr[3];
			this.users[name].setBattleStatus( battlestatus, teamcolor );
		}
		else if( cmd === 'CLIENTSTATUS' )
		{
			name = msg_arr[1];
			status = msg_arr[2];
			this.users[name].setStatus(status);
			
			inProgress = this.users[name].isInGame;
			blistStore = this.battleListStore;
			
			var items, item;
			items = blistStore.query({ 'host':name });
			array.forEach(items, function(curItem){
				item = curItem;
			}, this)
			if( typeof item !== 'undefined' )
			{
				item.progress = inProgress;
				item.status = this.battleManager.statusFromData(item);
				blistStore.notify( item, item.id );
			}
		}
		
		else if( cmd === 'CLIENTS' )
		{
			channel = msg_arr[1];
			for(i=2; i < msg_arr.length; i++)
			{
				name = msg_arr[i];
				topic.publish('Lobby/chat/channel/addplayer', {'channel':channel, 'name':name }  )
			}
		}
		
		else if( cmd === 'DENIED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert2('Login Failed. Reason: ' + rest);
			this.disconnect();
			this.makeLoginDialog();
		}
		else if( cmd === 'FORCEQUITBATTLE' )
		{
			alert2('You are being removed from the battle room.');
		}
		
		else if( cmd === 'JOIN' )
		{
			channel = msg_arr[1];
			if( channel === 'extension' )
			{
				return;
			}
			topic.publish('Lobby/chat/addroom', {'name':channel} )
		}
		else if( cmd === 'JOINED' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			topic.publish('Lobby/chat/channel/addplayer', {'channel': channel, 'name':name, 'joined':true }  )
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
			this.battleRoom.joinBattle( {'battleId':battleId, 'gameHash':gameHash }  )
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
				'isInBattle' : true,
				'battleId' : battleId,
				'scriptPassword': scriptPassword
			} );
			topic.publish('Lobby/battles/addplayer', {'name':name, 'battleId':battleId, 'scriptPassword':scriptPassword }  )
			
			
			
		}
		
		else if( cmd === 'LEAVE' )
		{
			channel = msg_arr[1];
			topic.publish('Lobby/chat/remroom', {'name':channel} )
		}
		
		else if( cmd === 'LEFT' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			message = msg_arr.slice(3).join(' ');
			topic.publish('Lobby/chat/channel/remplayer', {'channel': channel, 'name':name, 'msg':message }  )
		}
		else if( cmd === 'LEFTBATTLE' )
		{
			battleId = msg_arr[1];
			name = msg_arr[2];
			topic.publish('Lobby/battles/remplayer', {'name':name, 'battleId':battleId } );
			this.users[ name ].setStatusVals( {'isInBattle' : false } );
		}
		else if( cmd === 'LOGININFOEND' )
		{
			//this.battleManager.grid.endUpdate();
			//this.userList.grid.endUpdate();
			this.battleManager.delayedUpdateFilters();
			this.setNotIdle();
		}
		else if( cmd === 'MOTD' )
		{
			rest = msg_arr.slice(1).join(' ');
			this.addMotd( rest )
		}
		else if( cmd === 'PONG' )
		{
			this.gotPong = true;
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
			topic.publish('Lobby/battle/ring', {'battle':true, 'name':name } )
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
			topic.publish('Lobby/chat/channel/playermessage', {'channel':channel, 'name':name, 'msg':message, 'ex':true }  )
		}
		
		else if( cmd === 'SAIDBATTLE' )
		{
			name = msg_arr[1];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(2).join(' ');
			topic.publish('Lobby/battle/playermessage', {'battle':true, 'name':name, 'msg':message }  )
		}
		else if( cmd === 'SAIDBATTLEEX' )
		{
			name = msg_arr[1];
			if( this.ignoreName(name) )
			{
				return;
			}
			message = msg_arr.slice(2).join(' ');
			topic.publish('Lobby/battle/playermessage', {'battle':true, 'name':name, 'msg':message, 'ex':true }  )
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
				topic.publish('Lobby/chat/addprivchat', {'name':name, 'msg':message }  )
			}
			
			topic.publish('Lobby/chat/user/playermessage', {'userWindow':name, 'name':this.nick, 'msg':message }  )
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
			this.udpPort 				= msg_arr[3];
			this.serverMode 			= msg_arr[4];
			
			this.battleRoom.serverEngineVersion = this.serverSpringVer;
			if(this.registering)
			{
				this.uberSender('REGISTER '+ this.settings.settings.name + ' ' + MD5.b64_md5( this.settings.settings.password ) )
			}
			else
			{
				//var temp = this.appletHandler.getUnitsync(this.serverSpringVer);
				/*
				if( this.appletHandler.getUnitsync(this.serverSpringVer) === null )
				{
					this.localSpringVer = this.appletHandler.getUnitsync().getSpringVersion() + '';
					if( this.serverSpringVer !== this.localSpringVer  )
					{
						goToUrl = confirm('Your spring version does not match that used on the multiplayer server. \n\n'
							// +'Your version: ' + this.localSpringVer + '\n'
							 +'Your version: --- \n'
							+'Server version: ' + this.serverSpringVer + '\n\n'
							+'Click OK to download the latest version of Spring.');
						if( goToUrl )
						{
							url = 'http://springrts.com/wiki/Download';
							window.open(url,'_blank');
						}
					}
				}
				*/
				
				this.clearMotd();
				this.addMotd( '<b>Server Version: ' +  msg_arr[1] +'</b>' );
				this.addMotd( '<b>Spring Version: ' + this.serverSpringVer +'</b>' );
				
				this.login();
			}
		}
		else if( cmd === 'UPDATEBATTLEINFO' )
		{
			battleId = msg_arr[1];
			topic.publish('Lobby/battles/updatebattle', {
				'battleId' 	: battleId,
				'spectators' 	: msg_arr[2],
				'locked' 		: msg_arr[3] === '1',
				'map_hash' 		: msg_arr[4],
				//'map' 			: msg_arr.slice(5).join(' ').split('\t')
				'map' 			: msg_arr.slice(5).join(' ')
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
	
	'remBattle':function(battleId)
	{
		var battle;
		battle = this.battleListStore.get(battleId);
		if( typeof battle !== 'undefined' )
		{
			this.users[ battle.host ].setStatusVals( {'isHost' : false } );
			this.battleListStore.remove(battleId);
			this.battleManager.delayedUpdateFilters();
		}
		if( this.battleRoom.battleId === battleId )
		{
			alert2('The battleroom was closed.');
			this.battleRoom.closeBattle();
		}
	},
	
	'said':function(channel, name, message)
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
			return;
		}
		topic.publish('Lobby/chat/channel/playermessage', {'channel':channel, 'name':name, 'msg':message }  );
	},
	'ignoreName':function(name)
	{
		var ignoreList
		ignoreList = this.settings.settings.ignoreList.split('\n');
		return array.indexOf( ignoreList, name ) !== -1;
	},
	'saidPrivate':function(name, message)
	{
		var backlogData, channel, channels, time, battleId, jsonCmd, jsonString, json, hostName, elo, userName;
		if( name === 'Nightwatch' )
		{
			topic.publish('Lobby/chat/user/playermessage', {'userWindow':name, 'name':name, 'msg':message }  );
			if( message.search(/^!pm\|/) === 0 )
			{
				backlogData = message.split('|')
				channel = backlogData[1];
				name = backlogData[2];
				time = backlogData[3];
				message = backlogData.slice(4).join('|');
				if( channel === '' )
				{
					topic.publish('Lobby/chat/addprivchat', {'name':name, 'msg':message }  )
					topic.publish('Lobby/chat/user/playermessage', { 'userWindow':name, 'name':name, 'msg':message, 'time':time }  )
				}
				else
				{
					topic.publish('Lobby/chat/channel/playermessage', {'channel':channel, 'name':name, 'msg':message, 'time':time }  )
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
					topic.publish('Lobby/chat/channel/subscribe', { 'name':channel, 'subscribed':true }  )
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
			}
			else if( message.search(/^USER_EXT /) === 0 )
			{
				userName = message.split(' ')[1];
				//console.log(userName, message)
				elo = message.match(/EffectiveElo\|(\d*)\|/)
				if( elo !== null )
				{
					elo = elo[1];
					if( typeof this.users[userName] !== 'undefined' )
					{
						this.users[userName].elo = elo;
					}
				}
			}
			
			return;
		}
		
		else if( this.newBattleReady && message === "I'm here! Ready to serve you! Join me!" )
		{
			this.newBattleReady = false;
			var smsg;
			battleId = this.users[name].battleId;
			this.battleManager.joinBattle( battleId, this.newBattlePassword );
			return;
		}
		topic.publish('Lobby/chat/addprivchat', {'name':name, 'msg':message }  );
		topic.publish('Lobby/chat/user/playermessage', {'userWindow':name, 'name':name, 'msg':message }  );
	},
	
	'setJugglerConfig':function( config )
	{
		this.juggler.config = config;
		
		this.battleManager.setQuickMatchButton( config.Active )
	},
	'setJugglerState':function(state)
	{
		this.juggler.state = state;
	},
	
	'getSubscriptions':function()
	{
		this.uberSender('SAYPRIVATE Nightwatch !listsubscriptions');
	},
	
	//connection
	'uberSender':function(message)
	{
		console.log( "<LOCAL> " + message );
		if(this.connected)
		{
			this.socketSend( message );
		}
	},
	
	'login':function ()
	{	
		var message, compatFlags, osCpuHack;
		this.nick = this.settings.settings.name;
		this.pass = this.settings.settings.password;
		topic.publish('SetNick', {'nick':this.nick} )
		compatFlags = 'eb';
		osCpuHack = ({
			'Windows': '7777',
			'Linux': '7778',
			'Linux64': '7778',
			'Mac': '7779'
		})[this.os]
		if( osCpuHack === null || typeof osCpuHack === 'undefined' )
		{
			alert('OS not found');
			osCpuHack = '7777';
		}
		message = 'LOGIN ' + this.nick + ' ' + MD5.b64_md5( this.pass ) + ' ' + osCpuHack + ' * SpringWebLobby 0.0001' + '\t0\t' + compatFlags;
		this.uberSender(message)
	},
	
	'connectButtonPush':function()
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
	
	'connectToSpring':function()
	{
		this.socketConnect(this.url, this.port);
		this.connected = true;
		this.connectButton.set('label', 'Connecting...');
		this.connectButton.set('iconClass', 'smallIcon connectingImage');
		topic.publish('Lobby/connecting', {})
	},
	
	// Connect to a given url and port
	'socketConnect':function (url, port)
	{
		this.getJavaSocketBridge().connect(url, port);
	},
	
	// Disconnect
	'socketDisconnect':function ()
	{
		this.getJavaSocketBridge().disconnect();
	},
	
	// Write something to the socket
	'socketSend':function (message)
	{
		this.getJavaSocketBridge().send(message);
	},
	
	'setIsInGame':function(inGame)
	{
		//if you're not logged in but start a single player game.
		if( !( this.nick in this.users ) )
		{
			return; 
		}
		this.users[ this.nick ].setStatusVals( {'isInGame' : inGame } );
		this.users[ this.nick ].sendStatus();
	},
	
	// Report an error
	'onSocketError':function (message){
		alert2(message);
	},
	
	// Get the applet object
	'getJavaSocketBridge':function (){
		//return document.getElementById('JavaSocketBridge');
		return document.WeblobbyApplet;
	},
	
	'blank':null
}); }); //declare lwidgets.Lobby


