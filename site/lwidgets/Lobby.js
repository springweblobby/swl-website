///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////

/*
Todo:
server player list
*/


define(
	'lwidgets/Lobby',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		"dojox",
		
		//"lwidgets",
		'dijit/_WidgetBase',
		
		//'dojox/grid',
		
		'lwidgets/LobbySettings',
		'lwidgets/ChatManager',
		'lwidgets/BattleManager',
		'lwidgets/ChatRoom',
		'lwidgets/BattleRoom',
		'lwidgets/BattleMap',
		
		
		// *** extras ***
		
		'dojo/text', //for dojo.cache
		
		
		'dijit/Dialog',
		
		'dijit/layout/BorderContainer',
		'dijit/layout/TabContainer',
		'dijit/layout/ContentPane',
		
		'dijit/form/TextBox',
		'dijit/form/Select',
		'dijit/form/Button',
		
		'dojox/grid/DataGrid',
		
		'dijit/_Templated',
		//'dijit._TemplatedMixin',	
		
		//'dojo/data',
		'dojo/data/ItemFileWriteStore',
	
	],
	function(declare,
			
			dojo, dijit, dojox,
			
			WidgetBase,
			
			LobbySettings,
			ChatManager,
			BattleManager,
			Chatroom,
			BattleRoom, 
			BattleMap
			
	){




dojo.declare("User", null, {
	
	'name':'',
	
	'country':'',
	'cpu':'',
	
	'status':null,
	'battleStatus':null,
	
	//lobby status
	'isInGame':null,
	'inGameSince':'',
	'isAway':null,
	'awaySince':'',
	'isAdmin':null,
	'isBot':null,
	'rank':null,
		
	//battle status
	'isReady':null,
	'teamNumber':null,
	'allyNumber':null,
	'isSpectator':null,
	'syncStatus':null,
	'side':null,
	'teamColor':'0',
	'r':null,
	'g':null,
	'b':null,
	
	//bot stuff
	'owner':'',
	'ai_dll':'',
	
	
	//extra
	'isHost':false,
	'isInBattle':false,
	
	'battleId':0,
	
	'constructor':function(/* Object */args){
		dojo.safeMixin(this, args);
	},
	
	'toTestString':function()
	{
		return this.name + ' || t:' + this.teamNumber + '; a:' + this.allyNumber;
	},
	'toString':function()
	{
		if(this.owner !== '')
		{
			return this.name + ' (' + this.ai_dll + ') (' + this.owner + ') ';
		}
		return this.name;
	},
	
	
	//set the status number
	'setStatus':function(status)
	{
		var old;
		
		this.status = status;
		
		old = this.isInGame;
		this.isInGame = (status & 1) > 0;
		//if (this.isInGame && !old) this.inGameSince = date.toLocaleTimeString();
		//if (!this.isInGame) this.inGameSince = '';
		this.setInGameSince(old)
		
		old = this.isAway;
		this.isAway = (status & 2) > 0;
		this.setAwaySince(old)
		
		this.isAdmin = (status & 32) > 0;
		this.isBot = (status & 64) > 0;
		this.rank = (status & 28) >> 2;
		
		if( this.isHost && this.isInGame )
		{
			dojo.publish('Lobby/battle/checkStart');
		}
	},
	
	'setAwaySince':function( old )
	{
		var date;
		date = new Date();
		
		if (this.isAway && !old) this.awaySince = date.toLocaleTimeString();
		if (!this.isAway) this.awaySince = '';
	},
	'setInGameSince':function( old )
	{
		var date;
		date = new Date();
		
		if (this.isInGame && !old) this.inGameSince = date.toLocaleTimeString();
		if (!this.isInGame) this.inGameSince = '';
	},
	
	
	//set the battle status number and color number
	'setBattleStatus':function(status, color)
	{
		var syncStatuses, hr, hg, hb;
		
		this.battleStatus = status;
		
		syncStatuses = [
			'Unknown',
			'Synced',
			'Unsynced'
		];
		
		this.isReady = (status & 2) > 0;
		this.teamNumber = (status >> 2) & 15;
		this.allyNumber = (status >> 6) & 15;
		this.isSpectator = (status & 1024) == 0;
		this.syncStatus = syncStatuses[ (status >> 22) & 3 ] ;
		this.side = (status >> 24) & 15;
		
		this.r = color & 255;
		this.g = (color >> 8) & 255;
		this.b = (color >> 16) & 255;
		
		this.hexColor = 'FFFFFF';
		if( this.r !== null )
		{
			hr = this.r.toString(16);
			hg = this.g.toString(16);
			hb = this.b.toString(16);
			if( hr.length < 2 ) hr = '0' + hr;
			if( hg.length < 2 ) hg = '0' + hg;
			if( hb.length < 2 ) hb = '0' + hb;
			this.hexColor = hr+hg+hb;
		}
		
		dojo.publish('Lobby/battle/playerstatus', [{'name':this.name, user:this }] );
	},
	
	'sendStatus':function()
	{
		smsg = "MYSTATUS " + this.status;
		dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
	},
	
	//pass values in using an object
	'setStatusVals':function(vals)
	{
		var old, old2;
		old = this.isAway;
		old2 = this.isInGame;
		dojo.safeMixin(this, vals);
		this.setAwaySince(old)
		this.setInGameSince(old2)
		this.updateStatusNumbers();
		dojo.publish('Lobby/battle/playerstatus', [{'name':this.name, user:this }] );
	},
	
	//returns the status number
	'updateStatusNumbers':function()
	{
		var status, battleStatus, syncStatusIndices;
		
		syncStatusIndices = {
			'Unknown':'0',
			'Synced':'1',
			'Unsynced':'2'
		};
		
		battleStatus = 0;
		if (this.isReady) battleStatus |= 2;
		battleStatus += (this.teamNumber & 15) << 2;
		battleStatus += (this.allyNumber & 15) << 6;
		if (!this.isSpectator) battleStatus |= 1024;
		battleStatus += ( parseInt( syncStatusIndices[this.syncStatus] ) & 3) << 22;
		battleStatus += (this.side & 15) << 24;
		this.battleStatus = battleStatus;
		
		
		//status = this.status;
		status = 0;
		status |= this.isInGame ? 1 : 0;
		status |= this.isAway ? 2 : 0;
		this.status = status;
		
	},
	
	'getTeamColorHex':function()
	{
		//convert this.r, this.g and this.b to hex string
		
	},
	
	'blank':null
});//declare User	

dojo.declare("Script", [ ], {
	'script':'',
	'scriptTree':null,
	'constructor':function(args)
	{
		dojo.safeMixin(this, args);
		this.scriptTree = {};
	},
	'addScriptPath':function(tree, keyPathArr, val)
	{
		var keyPath, tree2;
		tree2 = tree;
		keyPath = keyPathArr[0];
		if( keyPathArr.length > 1 )
		{
			if( !tree2[keyPath] )
			{
				tree2[keyPath] = {};
			}
			tree2[keyPath] = this.addScriptPath( tree2[keyPath], keyPathArr.slice(1), val );
		}
		else
		{
			tree2[keyPath] = val;
		}
		return tree2;
	},
	
	'removeScriptPath':function(tree, keyPathArr)
	{
		var keyPath, tree2;
		tree2 = tree;
		keyPath = keyPathArr[0];
		if( keyPathArr.length > 1 )
		{
			tree2[keyPath] = this.removeScriptPath( tree2[keyPath], keyPathArr.slice(1) );
		}
		else
		{
			delete tree2[keyPath];
		}
		return tree2;
	},
	
	'addScriptTag':function(keyPath, val)
	{
		var keyPathArr;
		keyPathArr = keyPath.split('/');
		this.scriptTree = this.addScriptPath( this.scriptTree, keyPathArr, val )
	},
	
	'removeScriptTag':function(keyPath)
	{
		var keyPathArr;
		keyPathArr = keyPath.split('/');
		this.scriptTree = this.removeScriptPath( this.scriptTree, keyPathArr )
	},
	
	'scriptify':function(tree, level)
	{
		var script, v, tabs;
		script = '';
		tabs = Array(level+1).join('\t');
		for( k in tree )
		{
			v = tree[k];
			if( typeof(v) === 'object' )
			{
				script += tabs + '[' + k + ']\n';
				script += tabs + '{\n';
				script += this.scriptify(v, level+1) + '\n'
				script += tabs + '}\n';
			}
			else
			{
				script += tabs + k + '=' + v + ';\n';	
			}
		}
		return script;
	},
	
	'getScript':function()
	{
		return this.scriptify(this.scriptTree, 0)
	},
	
	'blank':null
});//declare Script

dojo.declare("UnitSync", [ ], {
	
	'modCount':0,
	'mapCount':0,
	'modList':null,
	
	'path':'',
	
	'constructor':function(args)
	{
		var i;
		dojo.safeMixin(this, args);
		
		this.modList = [];
		try
		{
			this.getUnitsync().init(false, 7);
			this.modCount = this.getUnitsync().getPrimaryModCount();
			this.mapCount = this.getUnitsync().getMapCount();
			/*
			for(i=0; i < this.modCount; i++)
			{
				console.log( this.getUnitsync().GetPrimaryModName( i ) );
				this.modList.push( this.getUnitsync().GetPrimaryModName( i ) )
			}
			*/
		}
		catch(e)
		{
			
		}
	},
	
	'getUnitsync':function(){
		try
		{
			//return document.JavaUnitSync.getUnitsync(this.path + "\\unitsync.dll");
			return document.JavaUnitSync.getUnitsync(this.path);
		}
		catch( e )
		{
			alert('There was a problem accessing Spring. Please check that: \n- Java is enabled. \n- Your path to Spring in the settings tab is correct. \n\nYou will need to reload the page.');
		}
		return null;
	},
	
	//console.log( "TEST2: " + this.getJavaUnitSync().getSpringVersion() );
	
	'blank':null
});//declare UnitSync



//dojo.declare("lwidgets.Lobby", [ dijit._Widget, dijit._Templated ], {
//return dojo.declare("lwidgets.Lobby", [ dijit._Widget ], {
return declare([ WidgetBase ], {
//declare([ WidgetBase ], {
//declare( 'lwidgets.Lobby', [ WidgetBase ], {
	'pingPongTime':30000,
	'gotPong':true,
	
	'nick':'',
	'password':'',
	'url' : 'springrts.com',
	'port' : '8200',
	'agreementTextTemp':'',
	'agreementText':'',
	'springVersion':'',
	'localSpringVersion':'',
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
	'battleManager':null,
	'settings':null,
	'scriptObj':null,
	'renameButton':null,
	'changePassButton':null,
	'users':null,
	
	'battleListStore':null,
	
	'unitSync':null,
	
	'idleTimeout':null,
	
	'newBattleReady':false,
	'newBattlePassword':'',
	
	//'constructor':function(){},
	
	'postCreate' : function()
	{
		this.inherited(arguments);
		dojo.subscribe('Lobby/receive', this, function(data){ this.uberReceiver(data.msg) });
		dojo.subscribe('Lobby/rawmsg', this, function(data){ this.uberSender(data.msg) });
		dojo.subscribe('Lobby/startgame', this, 'startGame');
		dojo.subscribe('Lobby/notidle', this, 'setNotIdle');
		dojo.subscribe('Lobby/makebattle', this, 'makeBattle');
		dojo.subscribe('Lobby/focuschat', this, 'focusChat');
		
		dojo.addOnUnload( dojo.hitch(this, 'disconnect') );
		
		setInterval( function(thisObj){ thisObj.pingPong(); }, this.pingPongTime, this );
	},
	
	'buildRendering':function()
	{
		var tabPaneDiv, mainDiv, battleDiv, homeDiv,
			homeDivLeft, homeDivRight,
			registerButton
			;
		
		this.users = {};
		this.scriptObj = new Script();
		
		this.setupStore();
		this.settings = new LobbySettings();
		
		mainDiv = dojo.create('div', {'style': {'height': '100%', 'width': '100%;' }});
		
		this.mainContainer = new dijit.layout.BorderContainer({
			design:"sidebar",
			gutters:true,
			liveSplitters:true,
			'style': {'height': '100%', 'width': '100%;' }
			,'onMouseUp':function(){dojo.publish('ResizeNeeded', [{}] );}
			//,'parseOnLoad':false
		//}, mainDiv);
		}).placeAt(mainDiv);
		
		
		//this.domNode = dojo.create('div', {'style': {'height': '100%', 'width': '100%;' }});
		tabPaneDiv = dojo.create('div', {}, mainDiv);
		//minHeight not working (nor min-height)
		battleDiv = dojo.create('div', {'style': {'height': '200px', 'width': '100%;' }}, mainDiv);
		
		this.tc = new dijit.layout.TabContainer( {
            'style': {'height': '400px', 'width': '100%;' }
        //}).placeAt(tabPaneDiv);
        });
		
		
		
		
		this.unitSync = new UnitSync( {'path':this.settings.settings.springPath } )
		
		//this.battleRoom = new lwidgets.Battleroom( {'nick':this.nick, 'battleList':battleList } ).placeAt(battleDiv)
		this.battleRoom = new BattleRoom( {
			'settings':this.settings,
			'nick':this.nick,
			'users':this.users,
			'unitSync':this.unitSync
		//} ).placeAt(battleDiv)
		} );
		//battlePane.set('content', this.battleRoom);
		
		
		//var tcPane = new dijit.layout.ContentPane({ splitter:true, region:"center" }, tabPaneDiv );
		var tcPane = new dijit.layout.ContentPane({
			splitter:true,
			region:"center",
			'content':this.tc
			//'content':this.battleRoom
		} );
		this.mainContainer.addChild(tcPane);
		//tcPane.set('content', this.battleRoom)
		
		
		this.battlePane = new dijit.layout.ContentPane({
			'style': {'height': '200px', 'width': '100%;' },
			'splitter':true,
			'region':'bottom',
			'minSize':80,
			'maxSize':600
			,'content':this.battleRoom
		//}, battleDiv );
		} );
		this.mainContainer.addChild(this.battlePane);
		this.domNode = mainDiv;
		
		
		//home tab
		homeDiv = dojo.create('div', {});
		var homeDivLeft = dojo.create('div', { 'style':{'position':'absolute', 'width':'50%' }, 'innerHTML':'Thank you for using Spring Web Lobby. <br /><br /> '}, homeDiv);
		var homeDivRight = dojo.create('div', { 'style':{'position':'absolute', 'width':'50%', 'right':'0px' } }, homeDiv);
		dojo.subscribe( 'Lobby/motd', this, function(data){
			dojo.attr( homeDivRight, 'innerHTML', ( dojo.attr(homeDivRight,'innerHTML') + '<br />' + data.line ) );
		});
		dojo.subscribe( 'Lobby/clearmotd', this, function(){
			dojo.attr( homeDivRight, 'innerHTML', '' );
		});
		

		this.connectButton = new dijit.form.Button({
			'label':'Connect',
			'onClick':dojo.hitch(this, 'connectButtonPush')
		}).placeAt(homeDivLeft);
		dojo.create('br', {}, homeDivLeft);
		dojo.create('br', {}, homeDivLeft);
		this.renameButton = new dijit.form.Button({
			'label':'Rename...',
			'disabled':'disabled',
			'onClick':dojo.hitch(this, 'makeRenameDialog')
		}).placeAt(homeDivLeft);
		dojo.create('br', {}, homeDivLeft);
		this.changePassButton = new dijit.form.Button({
			'label':'Change Password...',
			'disabled':'disabled',
			'onClick':dojo.hitch(this, 'makeChangePassDialog')
		}).placeAt(homeDivLeft);
		dojo.create('br', {}, homeDivLeft);
		registerButton = new dijit.form.Button({
			'label':'Register...',
			'onClick':dojo.hitch(this, 'makeRegisterDialog')
		}).placeAt(homeDivLeft);
		
		cpCurrent = new dijit.layout.ContentPane({
            'title': "Home",
			'iconClass':'smallIcon blobbyImage',
            'content': homeDiv 
        });
		this.tc.addChild( cpCurrent );
		
		this.setupTabs();
		
	},
	
	'focusChat':function( data )
	{
		this.tc.selectChild( 'chatManagerPane' );
	},
	
	'makeBattle':function()
	{
		var dlg, nameInput, passInput, gameSelect, dlgDiv, goButton, rapidGames;
		dlgDiv = dojo.create( 'div', {'width':'400px'} );
		
		dojo.create('span',{'innerHTML':'Room Name '}, dlgDiv )
		nameInput  = new dijit.form.TextBox({
			'value':'My Game!'
		}).placeAt(dlgDiv)
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		rapidGames = [
		    { label: 'Zero-K', value: 'zk:stable' },
		    { label: 'EvolutionRTS', value: 'evo:test' },
		    { label: 'The Cursed', value: 'thecursed:latest' },
		    { label: 'Spring:1944', value: 's44:latest' },
		    { label: 'Kernel Panic', value: 'kp:stable' },
		    { label: 'Conflict Terra', value: 'ct:stable' },
		    { label: 'Balanced Annihilation', value: 'ba:latest' },
		    { label: 'XTA', value: 'xta:latest' },
		    { label: 'NOTA', value: 'nota:latest' }
		];
		
		dojo.create('span',{'innerHTML':'Game '}, dlgDiv )
		gameSelect = new dijit.form.Select({
			//'value':option.value,
			'style':{/*'position':'absolute', 'left':'160px', */'width':'160px'},
			'options': rapidGames
		}).placeAt(dlgDiv)
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		dojo.create('span',{'innerHTML':'Password '}, dlgDiv )
		passInput = new dijit.form.TextBox({
			'value':'secret',
			'style':{'width':'160px'}
		}).placeAt(dlgDiv)
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		dlg = new dijit.Dialog({
            'title': "Create A New Battle Room",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Create Game',
			'onClick':dojo.hitch(this, function(){
				var smsg;
				if( passInput.value === '' )
				{
					alert('Please enter a password.');
				}
				else
				{
					this.newBattleReady = true;
					this.newBattlePassword = passInput.value;
					smsg = 'SAYPRIVATE Springie !spawn mod='+ gameSelect.value +',title='+ nameInput.value +',password=' + passInput.value;
					dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
					dlg.hide();
				}
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	
	'setNotIdle':function()
	{
		var minutes;
		minutes = 20;
		if( this.idleTimeout !== null )
		{
			clearTimeout( this.idleTimeout );
		}
		this.users[ this.nick ].setStatusVals( {'isAway' : false } );
		this.users[ this.nick ].sendStatus();
		
		this.idleTimeout = setInterval( function(thisObj){
			thisObj.users[ thisObj.nick ].setStatusVals( {'isAway' : true } );
			thisObj.users[ thisObj.nick ].sendStatus();
		}, 60000 * minutes, this );
	},
	
	
	'setupStore':function()
	{
		this.battleListStore = new dojo.data.ItemFileWriteStore(
			{
				'data':{
					'identifier':'battle_id',
					'label':'title',
					'items':[]
				}
			}
		);
		
	},
	
	'startGame':function()
	{
		var uriContent, newWindow;
		alert('Let\'s start Spring! \n A script file will be downloaded now. Open it with spring.exe.')
		//console.log(this.scriptObj.getScript());
		
		uriContent = "data:application/x-spring-game," + encodeURIComponent( this.scriptObj.getScript() );
		newWindow = window.open(uriContent, 'script.spg');
	},
	
	'addUser':function(name, country, cpu)
	{
		this.users[name] = new User({ 'name':name, 'country':country, 'cpu':cpu });
	},
	'remPlayer':function(name)
	{
		delete this.users[name];
	},
	
	'makeRegisterDialog':function()
	{
		var dlg, nameInput, passInput, dlgDiv, goButton;
		dlgDiv = dojo.create( 'div', {} );
		
		dojo.create('span',{'innerHTML':'Name '}, dlgDiv )
		nameInput = dojo.create( 'input', {'type':'text'}, dlgDiv );
		dojo.create('br',{}, dlgDiv )
		
		dojo.create('span',{'innerHTML':'Password '}, dlgDiv )
		passInput = dojo.create( 'input', {'type':'password'}, dlgDiv );
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		dlg = new dijit.Dialog({
            'title': "Register A New Account",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Register',
			'onClick':dojo.hitch(this, function(){
				this.registering = true;
				this.settings.setSetting( 'name', dojo.attr(nameInput, 'value') );
				this.settings.setSetting( 'password', dojo.attr(passInput, 'value') );
				this.connectToSpring();
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	'makeChangePassDialog':function()
	{
		var dlg, oldPassInput, newPassInput, dlgDiv, goButton;
		dlgDiv = dojo.create( 'div', {} );
		
		dojo.create('span',{'innerHTML':'Old Password '}, dlgDiv )
		oldPassInput = dojo.create( 'input', {'type':'password'}, dlgDiv );
		dojo.create('br',{}, dlgDiv )
		
		dojo.create('span',{'innerHTML':'New Password '}, dlgDiv )
		newPassInput = dojo.create( 'input', {'type':'password'}, dlgDiv );
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		dlg = new dijit.Dialog({
            'title': "Change Your Password",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Change Password',
			'onClick':dojo.hitch(this, function(){
				this.uberSender(
					'CHANGEPASSWORD '
					+ dojo.attr(oldPassInput, 'value')
					+ dojo.attr(newPassInput, 'value')
				);
				dlg.hide();
			})
		}).placeAt(dlgDiv);
		
		dlg.show();	
	},
	
	'makeRenameDialog':function()
	{
		var dlg, nameInput, dlgDiv, goButton;
		dlgDiv = dojo.create( 'div', {} );
		
		dojo.create('span',{'innerHTML':'New Name '}, dlgDiv )
		nameInput = dojo.create( 'input', {'type':'text'}, dlgDiv );
		dojo.create('br',{}, dlgDiv )
		dojo.create('br',{}, dlgDiv )
		
		dlg = new dijit.Dialog({
            'title': "Rename Your Account",
            'style': "width: 300px",
			'content':dlgDiv
        });
		
		goButton = new dijit.form.Button({
			'label':'Rename (will reconnect)',
			'onClick':dojo.hitch(this, function(){
				var newName;
				newName = dojo.attr(nameInput, 'value');
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
		var divStuff;
		
		divStuff = 'Spring Web Lobby version ' + this.versionNum
			+ '<br />'
			+ '<a href='
			+ '"http://springrts.com/phpbb/viewtopic.php?f=64&t=26414&sid=60f9caa5e3d8e30314b28911e40c0011" '
			+ 'target="_blank" >More info about this page.</a>'
			+ '<br />'
			+ '<br />'
			+ 'Download the <a href="http://springrts.com/wiki/Download" target="_blank" >Spring Engine</a>.';
			+ '<br />'
			;
			
		return dojo.create('div', {'innerHTML':divStuff});
	},
	
	'setupTabs':function()
	{
		var chatManager, battleManager, cpCurrent;
		
		//chat tab
		chatManager = new ChatManager( {'settings':this.settings, 'users':this.users } )
		cpCurrent = new dijit.layout.ContentPane({
            'title': "Chat",
			'id':'chatManagerPane',
            'content': chatManager.domNode
        });
        this.tc.addChild( cpCurrent );
		chatManager.startup2();
		
		//battle list tab
		battleManager = new BattleManager( { 'store':this.battleListStore } );
		cpCurrent = new dijit.layout.ContentPane({
            'title': "Battles",
            'content': battleManager.domNode
			//'onShow':dojo.hitch(battleManager, battleManager.startup2)
        });
        this.tc.addChild( cpCurrent );
		this.battleManager = battleManager;
		this.battleManager.startup2();
		
		//Settings tab
		cpCurrent = new dijit.layout.ContentPane({
		    'title': "Settings",
            //content: dojo.create('div', {'innerHTML':'Settings go here.'})
            content: this.settings
        });
        this.tc.addChild( cpCurrent );
		
		//Help tab
		cpCurrent = new dijit.layout.ContentPane({
		    'title': "Help",
            content: this.getHelpContent()
        });
        this.tc.addChild( cpCurrent );
		
		//move this elsewhere
		this.battleRoom.battleListStore = this.battleListStore;
	},
	
	'startup2':function()
	{
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
			this.tc.startup();
			this.battleRoom.startup2();
			//this.battleRoom.startup();
			
		}
	},
	
	'pingPong':function()
	{
		/*
		if( this.authorized )
		{
			this.uberSender('PING ' + 'swl');
			
			setTimeout( function(thisObj){ thisObj.pingTimeOut(); }, this.pingPongTime, this );	
			setTimeout( function(thisObj){ thisObj.pingPong(); }, this.pingPongTime, this );	
		}
		*/
		if( this.authorized )
		{
			if( !this.gotPong )
			{
				alert('Connection lost.');
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
		htmlText = convertRTFtoHTML(this.agreementText);
		accept = confirm( htmlText );
		if(accept)
		{
			this.uberSender('CONFIRMAGREEMENT');
			this.login();
		}
		else
		{
			this.disconnect();
		}
	},
	
	'disconnect':function()
	{
		this.battleListStore.revert();
		this.battleListStore.clearOnClose = true;
		this.battleListStore.close();
		this.battleListStore.data =
		{
			'identifier':'battle_id',
			'label':'title',
			'items':[]
		}
		
		//this.battleList.resetStore();
		
		this.connectButton.set('label', 'Connect');
		this.renameButton.set('disabled', true)
		this.changePassButton.set('disabled', true)
		this.connected = false;
		this.authorized = false;
		this.socketDisconnect();
	},
	
	'uberReceiver':function(msg)
	{
		var msg_arr, cmd, channel, message, rest, battle_id, 
			i, time, user, battlestatus, status, teamcolor,
			url,
			autoJoinChans,
			country, cpu,
			blistStore,
			scriptPassword,
			bot_name,
			inProgress,
			userCount,
			topic
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
		CLIENTBATTLESTATUS
		REQUESTBATTLESTATUS
		HANDICAP 
		KICKFROMBATTLE
		FORCEQUITBATTLE
		FORCETEAMNO
		FORCEALLYNO
		FORCETEAMCOLOR
		FORCESPECTATORMODE
		MYBATTLESTATUS 
		REDIRECT
		
		MYSTATUS
		CLIENTSTATUS 
		
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
			
			autoJoinChans = this.settings.settings.autoJoinChannelsList.split('\n');
			dojo.forEach(autoJoinChans, function(chan){
				this.uberSender( 'JOIN ' + chan.trim() );
			}, this);
			
			this.renameButton.set('disabled', null)
			this.changePassButton.set('disabled', null)
			
			this.pingPong();
		}
		else if( cmd === 'ADDBOT' )
		{
			rest = msg_arr.slice(6).join(' ');
			battle_id		= msg_arr[1];
			name			= msg_arr[2];
			owner 			= msg_arr[3];
			battlestatus	= msg_arr[4];
			teamcolor		= msg_arr[5];
			
			bot_name = '<BOT>' + name;
			
			var userCountry = this.users[owner].country;
			
			this.users[bot_name] = new User({ 'name':bot_name, 'owner':owner, 'ai_dll':rest, 'country':userCountry });
			dojo.publish('Lobby/battles/addplayer', [{ 'name':bot_name, 'battle_id':battle_id }] );
			this.users[bot_name].setBattleStatus( battlestatus, teamcolor );
		}
		else if( cmd === 'ADDSTARTRECT' )
		{
			dojo.publish('Lobby/map/addrect', [{
				'aID': msg_arr[1],	//alliance id
				'x1': msg_arr[2],
				'y1': msg_arr[3],
				'x2': msg_arr[4],
				'y2': msg_arr[5]
			}]);
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
			battle_id = msg_arr[1];
			this.remBattle( battle_id );
		}
		else if( cmd === 'BATTLEOPENED' )
		{
			rest = msg_arr.slice(11).join(' ').split('\t');
			
			//dojo.publish('Lobby/battles/addbattle', [{
			this.battleManager.addBattle({
				'battle_id' 	: msg_arr[1],
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
		
		else if( cmd === 'CHANNEL' )
		{
			channel = msg_arr[1];
			userCount = msg_arr[2];
			topic = msg_arr.slice(3).join(' ');
			dojo.publish('Lobby/chat/channels', [{'channel':channel, 'userCount':userCount, 'topic':topic }]  )
		}
		
		else if( cmd === 'CHANNELTOPIC' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			time = msg_arr[3];
			message = msg_arr.slice(4).join(' ');
			dojo.publish('Lobby/chat/channel/topic', [{'channel':channel, 'name':name, 'msg':message, 'time':time }]  )
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
				
			//this.battleList.store.fetchItemByIdentity({
			//var request = store.fetch({query: {name:"Egypt"}, queryOptions: {ignoreCase: true}, onComplete: gotNames}
			blistStore.fetch({
				query:{'host':name},
				//'scope':this,
				'scope':this.battleManager,
				'onItem':function(item)
				{
					blistStore.setValue(item, 'progress', inProgress);
					blistStore.setValue(item, 'status', this.statusFromItem(item) );
				}
				
			});
		
			
		}
		
		else if( cmd === 'CLIENTS' )
		{
			channel = msg_arr[1];
			for(i=2; i < msg_arr.length; i++)
			{
				name = msg_arr[i];
				dojo.publish('Lobby/chat/channel/addplayer', [{'channel':channel, 'name':name }]  )
			}
		}
		
		else if( cmd === 'DENIED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert('Login Failed. Reason: ' + rest)
			this.disconnect();
		}
		
		else if( cmd === 'JOIN' )
		{
			channel = msg_arr[1];
			dojo.publish('Lobby/chat/addroom', [{'name':channel}] )
		}
		else if( cmd === 'JOINED' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			dojo.publish('Lobby/chat/channel/addplayer', [{'channel': channel, 'name':name, 'joined':true }]  )
		}
		else if( cmd === 'JOINFAILED' )
		{
			channel = msg_arr[1];
			rest = msg_arr.slice(2).join(' ');
			alert('Failed to join channel "' + channel + '" - ' + rest);
		}
		
		else if( cmd === 'JOINBATTLE' )
		{
			battle_id = msg_arr[1];
			//hashcode?
			dojo.publish('Lobby/battle/joinbattle', [{'battle_id':battle_id }]  )
		}
		else if( cmd === 'JOINBATTLEFAILED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert('Failed to join battle - ' + rest)
		}
		else if( cmd === 'JOINEDBATTLE' )
		{
			battle_id 		= msg_arr[1];
			name 			= msg_arr[2];
			scriptPassword 	= msg_arr[3];
			this.generateScript(battle_id, name, scriptPassword);
			dojo.publish('Lobby/battles/addplayer', [{'name':name, 'battle_id':battle_id }]  )
			this.users[ name ].setStatusVals( {
				'isInBattle' : true,
				'battleId' : battle_id
			} );
		}
		
		else if( cmd === 'LEAVE' )
		{
			channel = msg_arr[1];
			dojo.publish('Lobby/chat/remroom', [{'name':channel}] )
		}
		
		else if( cmd === 'LEFT' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			message = msg_arr.slice(3).join(' ');
			dojo.publish('Lobby/chat/channel/remplayer', [{'channel': channel, 'name':name, 'msg':message }]  )
		}
		else if( cmd === 'LEFTBATTLE' )
		{
			battle_id = msg_arr[1];
			name = msg_arr[2];
			dojo.publish('Lobby/battles/remplayer', [{'name':name, 'battle_id':battle_id }] );
			this.users[ name ].setStatusVals( {'isInBattle' : false } );
		}
		else if( cmd === 'LOGININFOEND' )
		{
			this.battleManager.grid.endUpdate();
			this.setNotIdle();
		}
		else if( cmd === 'MOTD' )
		{
			rest = msg_arr.slice(1).join(' ');
			dojo.publish('Lobby/motd', [{'line':rest }] );
		}
		else if( cmd === 'PONG' )
		{
			this.gotPong = true;
		}
		else if( cmd === 'REGISTRATIONACCEPTED' )
		{
			alert('Registration Successful!')
			this.registering = false;
			this.disconnect();
			this.connectToSpring();
		}
		else if( cmd === 'REGISTRATIONDENIED' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert('Registration Failed. Reason: ' + rest)
			this.disconnect();
			this.registering = false;
		}
		else if( cmd === 'REMOVEBOT' )
		{
			//REMOVEBOT BATTLE_ID name
			battle_id		= msg_arr[1];
			name			= msg_arr[2];
			
			bot_name = '<BOT>' + name;
			
			dojo.publish('Lobby/battles/remplayer', [{'name': bot_name, 'battle_id':battle_id }] );
			this.remPlayer(bot_name);
		}
		else if( cmd === 'REMOVESCRIPTTAGS' )
		{
			var scriptTags;
			
			scriptTags = msg_arr.slice(1).join(' ').split('\t');
			dojo.forEach(scriptTags, function(scriptTag){
				var key, val, scriptTagArr;
				scriptTagArr = scriptTag.split('=');
				key = scriptTagArr[0];
				val = scriptTagArr[1];
				
				key = key.toLowerCase();
				val = val.toLowerCase();
				
				this.scriptObj.removeScriptTag(key, val);
			}, this);
		}
		else if( cmd === 'REMOVESTARTRECT' )
		{
			dojo.publish('Lobby/map/remrect', [{
				'aID': msg_arr[1]	//alliance id
			}]);
		}
		else if( cmd === 'REMOVEUSER' )
		{
			//REMOVEUSER username
			name = msg_arr[1];
			this.remPlayer(name);
		}
		else if( cmd === 'RING' )
		{
			name = msg_arr[1];
			dojo.publish('Lobby/battle/ring', [{'battle':true, 'name':name }] )
		}
		else if( cmd === 'SAID' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			message = msg_arr.slice(3).join(' ');
			dojo.publish('Lobby/chat/channel/playermessage', [{'channel':channel, 'name':name, 'msg':message }]  )
		}
		else if( cmd === 'SAIDEX' )
		{
			channel = msg_arr[1];
			name = msg_arr[2];
			message = msg_arr.slice(3).join(' ');
			dojo.publish('Lobby/chat/channel/playermessage', [{'channel':channel, 'name':name, 'msg':message, 'ex':true }]  )
		}
		
		else if( cmd === 'SAIDBATTLE' )
		{
			name = msg_arr[1];
			message = msg_arr.slice(2).join(' ');
			dojo.publish('Lobby/battle/playermessage', [{'battle':true, 'name':name, 'msg':message }]  )
		}
		else if( cmd === 'SAIDBATTLEEX' )
		{
			name = msg_arr[1];
			message = msg_arr.slice(2).join(' ');
			dojo.publish('Lobby/battle/playermessage', [{'battle':true, 'name':name, 'msg':message, 'ex':true }]  )
		}
		
		else if( cmd === 'SAIDPRIVATE' )
		{
			name = msg_arr[1];
			message = msg_arr.slice(2).join(' ');
			
			if( this.newBattleReady && message === "I'm here! Ready to serve you! Join me!" )
			{
				this.newBattleReady = false;
				var smsg;
				battle_id = this.users[name].battleId;
				smsg = "JOINBATTLE " + battle_id + ' ' + 'secret' + ' ' + this.scriptPassword;
				dojo.publish( 'Lobby/rawmsg', [{'msg':smsg }] );
				return;
			}
			
			dojo.publish('Lobby/chat/addprivchat', [{'name':name, 'msg':message }]  )
			dojo.publish('Lobby/chat/user/playermessage', [{'userWindow':name, 'name':name, 'msg':message }]  )
		}
		else if( cmd === 'SAYPRIVATE' )
		{
			
			name = msg_arr[1];
			message = msg_arr.slice(2).join(' ');
			if( this.newBattleReady && message.search(/^!spawn/) !== -1 )
			{
				return;
			}
			dojo.publish('Lobby/chat/addprivchat', [{'name':name, 'msg':message }]  )
			dojo.publish('Lobby/chat/user/playermessage', [{'userWindow':name, 'name':this.nick, 'msg':message }]  )
		}
		
		else if( cmd === 'SERVERMSG' || cmd === 'BROADCAST' )
		{
			rest = msg_arr.slice(1).join(' ');
			alert('[ Server Message ]\n' + rest)
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
			dojo.forEach(scriptTags, function(scriptTag){
				var key, val, scriptTagArr, optionPair, optionKey, optionValue;
				scriptTagArr = scriptTag.split('=');
				key = scriptTagArr[0];
				val = scriptTagArr[1];
				
				key = key.toLowerCase();
				val = val.toLowerCase();
				
				
				this.scriptObj.addScriptTag(key, val);
				
				if( scriptTag.toLowerCase().match( /game\/modoptions\// ) )
				{
					optionPair = scriptTag.toLowerCase().replace( 'game/modoptions/', '' ).split('=');
					optionKey = optionPair[0];
					optionValue = optionPair[1];
					dojo.publish('Lobby/modoptions/updatemodoption', [{'key': optionKey, 'value':optionValue}]  )
				}
				
			}, this);
		}
		
		
		else if( cmd === 'TASServer' )
		{
			this.springVersion 	= msg_arr[2];
			this.udpPort 		= msg_arr[3];
			this.serverMode 	= msg_arr[4];
			
			if(this.registering)
			{
				this.uberSender('REGISTER '+ this.settings.settings.name + ' ' + MD5.b64_md5( this.settings.settings.password ) )
			}
			else
			{
				if( this.unitSync.getUnitsync() !== null )
				{
					this.localSpringVersion = this.unitSync.getUnitsync().getSpringVersion() + '';
					if( this.springVersion !== this.localSpringVersion  )
					{
						goToUrl = confirm('Your spring version does not match that used on the multiplayer server. Click OK to download the latest version of Spring.');
						if( goToUrl )
						{
							url = 'http://springrts.com/wiki/Download';
							window.open(url,'_blank');
						}
					}
				}
				
				dojo.publish('Lobby/clearmotd' );
				dojo.publish('Lobby/motd', [{'line':'<b>Server Version: ' +  msg_arr[1] +'</b>' }] );
				dojo.publish('Lobby/motd', [{'line':'<b>Spring Version: ' + this.springVersion+'</b>' }] );
				this.login();
			}
		}
		else if( cmd === 'UPDATEBATTLEINFO' )
		{
			battle_id = msg_arr[1];
			dojo.publish('Lobby/battles/updatebattle', [{
				'battle_id' 	: msg_arr[1],
				'spectators' 	: msg_arr[2],
				'locked' 		: msg_arr[3] === '1',
				'map_hash' 		: msg_arr[4],
				//'map' 			: msg_arr.slice(5).join(' ').split('\t')
				'map' 			: msg_arr.slice(5).join(' ')
			}]);
		}
		else if( cmd === 'UPDATEBOT' )
		{
			battle_id		= msg_arr[1];
			name			= msg_arr[2];
			battlestatus	= msg_arr[3];
			teamcolor		= msg_arr[4];
			bot_name = '<BOT>'+name;
			this.users[bot_name].setBattleStatus( battlestatus, teamcolor );
		}
		
	},//uberReceiver
	'remBattle':function(battle_id)
	{
		this.battleListStore.fetchItemByIdentity({
			'identity':battle_id,
			'scope':this,
			'onItem':function(item)
			{
				//this.users[ item.host ].isHost = false;
				this.users[ item.host ].setStatusVals( {'isHost' : false } );
				this.battleListStore.deleteItem(item);
				this.battleManager.delayedUpdateFilters();
			}
		});
	},
	
	'generateScript':function(battle_id, user, scriptPassword)
	{
		if(user !== this.nick)
		{
			return;
		}
		blistStore = this.battleListStore;
		//this.battleList.store.fetchItemByIdentity({
		blistStore.fetchItemByIdentity({
			'identity':battle_id,
			'scope':this,
			'onItem':function(item)
			{
				var ip, host, hostport, game, map;
				
				ip 			= blistStore.getValue(item, 'ip');
				host 		= blistStore.getValue(item, 'host');
				hostport 	= blistStore.getValue(item, 'hostport');
				game 		= blistStore.getValue(item, 'game');
				map 		= blistStore.getValue(item, 'map');
				
				//ModHash
				//AutohostPort
				
				this.scriptObj.addScriptTag( "GAME/GameType", 		game );
				this.scriptObj.addScriptTag( "GAME/SourcePort", 	'8300' );
				this.scriptObj.addScriptTag( "GAME/HostIP", 		ip );
				this.scriptObj.addScriptTag( "GAME/HostPort", 		hostport );
				this.scriptObj.addScriptTag( "GAME/IsHost", 		host === this.nick ? '1' : '0' );
				this.scriptObj.addScriptTag( "GAME/MyPlayerName", 	this.nick );
				if( scriptPassword )
				{
					this.scriptObj.addScriptTag( "GAME/MyPasswd", 	scriptPassword );
				}
			}
		});
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
		var message;
		this.nick = this.settings.settings.name;
		this.pass = this.settings.settings.password;
		dojo.publish('SetNick', [{'nick':this.nick}])
		message = 'LOGIN ' + this.nick + ' ' + MD5.b64_md5( this.pass ) +' 7777 * SpringWebLobby 0.0001';
		this.uberSender(message)
	},
	
	'connectButtonPush':function()
	{
		if( this.settings.settings.name === '' || this.settings.settings.password === ''  )
		{
			alert('Please enter your name and password in the Settings tab, '
				  + 'or register to create a new account by clicking on Register.')
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
		dojo.publish('Lobby/connecting', [{}])
	},
	
	// Connect to a given url and port
	'socketConnect':function (url, port)
	{
		if(java_socket_bridge_ready_flag)
		{
			//return
			this.getJavaSocketBridge().connect(url, port);
		}
		else
		{
			this.onSocketError("Java Socket Bridge cannot connect until the applet has loaded. Do you have the latest version of Java? Are you allowing Java to load in your browser?");
		}
		
	},
	
	// Disconnect
	'socketDisconnect':function ()
	{
		if(java_socket_bridge_ready_flag)
		{
			//return
			this.getJavaSocketBridge().disconnect();
		}
		else
		{
			this.onSocketError("Java Socket Bridge cannot disconnect until the applet has loaded.");
		}
	},
	
	// Write something to the socket
	'socketSend':function (message)
	{
		if(java_socket_bridge_ready_flag)
		{
			/*return */ this.getJavaSocketBridge().send(message);
		}
		else
		{
			this.onSocketError("Java Socket Bridge cannot send a message until the applet has loaded.");
		}
	},
	
	
	// Report an error
	'onSocketError':function (message){
		alert(message);
	},
	
	// Get the applet object
	'getJavaSocketBridge':function (){
		return document.getElementById('JavaSocketBridge');
	},
	
	'blank':null
}); }); //declare lwidgets.Lobby


/*
var test = new Script();
test.addScriptTag( "GAME/test1/StartMetal", 1000 );
test.addScriptTag( "GAME/test1/StartCheese", 300 );
//test.removeScriptTag( "GAME/test1/StartCheese" );
console.log( JSON.STRINGIFY( test.scriptTree));
console.log( test.getScript() );
*/


