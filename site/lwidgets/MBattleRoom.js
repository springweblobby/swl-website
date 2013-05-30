///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/MBattleRoom',
	[
		"dojo/_base/declare",
		'dojo/_base/array',

		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		'dojo/on',
		'dojo/mouse',
		'dojo/store/Memory',

		'lwidgets/BattleRoom',
		'lwidgets/ScriptManager',
		
		
		'dijit/Tooltip',
		'dijit/form/Select',
		
		'dojo/request/xhr',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now
		
		

	],
	function(declare,
		array,
		domConstruct, domStyle, domAttr, lang, topic, event, on, mouse, Memory,
		BattleRoom, ScriptManager,
		Tooltip,
		Select,
		xhr
	){
	return declare( [ BattleRoom ], {
	
	saystring:'SAYBATTLE',
	spads:false,
	bname:'Multiplayer Battleroom',
	
	'postCreate3':function()
	{
		this.subscribe('Lobby/battles/addplayer', 'addPlayer' );
		this.subscribe('Lobby/battles/remplayer', 'remPlayer' );
		this.subscribe('Lobby/battle/playermessage', 'battlePlayerMessage' );
		this.subscribe('Lobby/battles/updatebattle', 'updateBattle' );
		this.subscribe('Lobby/unitsyncRefreshed', 'unitsyncRefreshed' );
		this.subscribe('Lobby/download/processProgress', 'updateBar' );
		this.subscribe('Lobby/battle/ring', 'ring' );
		
		this.subscribe('Lobby/mission', 'playMission' );
	},
	
	sourcePortGetTimer:null,
	getSourcePort:function()
	{
		var internalSourcePortIp
		internalSourcePortIp = thisObj.appletHandler.sendSomePacket();
		
		if( thisObj.hosting )
		{
			//should never be in here
			thisObj.hostPort = internalSourcePortIp;
		}
		else
		{
			thisObj.sourcePort = internalSourcePortIp;
		}
	},
	startGettingSourcePort:function()
	{
		if( this.sourcePortGetTimer !== null )
		{
			return;
		}
		this.getSourcePort();
		this.sourcePortGetTimer = setInterval( lang.hitch(this, 'getSourcePort'), 20000, this);
	},
	stopGettingSourcePort:function()
	{
		clearInterval( this.sourcePortGetTimer );
	},
	
	'battlePlayerMessage':function(data)
	{
		var msgArr, rest, pollTitle;
		var pollData;
		var y;
		var n;
		var total;
		//* Springie8 Poll: Do you want to change to a suitable random map? [!y=0/1, !n=0/1]
		if( data.name === this.host && data.ex )
		{
			// [semprini]Autohost * CloggerMac called a vote for command "bset startmetal 1000" [!vote y, !vote n, !vote b]
			// [semprini]Autohost * Vote in progress: "bset startmetal 1000" [y:1/2, n:0/1(2)] (25s remaining)
		
			msgArr = data.msg.split(' ');
			//echo(msgArr)
			if( data.msg.search(/called a vote.*".*"/) !== -1 )
			{
				pollTitle = data.msg.match(/called a vote.*"(.*)"/)[1];
				domStyle.set( this.pollNode, 'display', 'inline' );
				this.pollYesBar.set( {'maximum': total, 'label':'? / ?' } );
				this.pollNoBar.set( {'maximum': total, 'label':'? / ?' } );
				
				this.pollYesBar.update( {'progress': 0 } );
				this.pollNoBar.update( {'progress': 0 } );
				
				domAttr.set( this.pollNameNode, 'innerHTML', pollTitle);
			}
			else if( data.msg.search(/Vote for .*(passed|failed)/) !== -1 )
			{
				domStyle.set( this.pollNode, 'display', 'none' );
			}
			else if( msgArr[0] === 'Poll:' || data.msg.search('Vote in progress:') !== -1 )
			{
				if( this.spads )
				{
					//pollData = data.msg.match(/\[y:(\d*)\/(\d*), n:(\d*)\/(\d*)\]/);
					pollData = data.msg.match(/\[y:(\d*)\/(\d*).*, n:(\d*)\/(\d*).*\]/);
				}
				else
				{
					pollData = data.msg.match(/\[!y=(\d*)\/(\d*), !n=(\d*)\/(\d*)\]/);
				}
				if( pollData !== null && pollData.length > 0 )
				{
					domStyle.set( this.pollNode, 'display', 'inline' );
					y = pollData[1];
					total = pollData[2];
					n = pollData[3];
					if( this.spads )
					{
						pollTitle = data.msg.match(/Vote in progress:.*"(.*)"/)[1];
					}
					else
					{
						pollTitle = msgArr.slice(1).join(' ').replace(/\[!y=.*\]/, '');
					}
					domAttr.set( this.pollNameNode, 'innerHTML', pollTitle);
					
					this.pollYesBar.set( {'maximum': total, 'label':y + ' / ' + total } );
					this.pollNoBar.set( {'maximum': total, 'label':n + ' / ' + total } );
					
					this.pollYesBar.update( {'progress': y } );
					this.pollNoBar.update( {'progress': n } );
					
					return;
				}
				else
				{
					domStyle.set( this.pollNode, 'display', 'none' );
				}
			}
			else if( data.msg.search(/Hi.*\(SPADS.*automated host\)/) !== -1 )
			{
				this.spads = true;
			}
		}
		this.playerMessage(data);
	},
	'sayYes':function()
	{
		var vote = this.spads ? ' !vote y' : ' !y';
		topic.publish( 'Lobby/rawmsg', {'msg': this.saystring + vote } );
	},
	'sayNo':function()
	{
		var vote = this.spads ? ' !vote n' : ' !n';
		topic.publish( 'Lobby/rawmsg', {'msg': this.saystring + vote } );
	},
	
	'finishedBattleStatuses':function()
	{
		this.gotStatuses = true;
		this.updatePlayState();
		//this.startGame();
	},
	
	updatePlayState:function()
	{
		var fakeUser;
		if( this.battleId !== 0 && this.gotStatuses )
		{
			fakeUser = clone( this.users[this.nick] )
			
			fakeUser.setStatusVals({
				isSpectator:this.specState,
				allyNumber:this.allianceId,
				teamNumber:this.getEmptyTeam(this.nick),
				syncStatus:this.synced ? 'Synced' : 'Unsynced',
				side:this.faction,
				isReady:true
			}, true);
			fakeUser.setTeamColor(this.teamColor);
			fakeUser.sendBattleStatus();
		}
	},
	'remPlayer':function( data )
	{
		var pname, line, user;
		if( data.battleId !== this.battleId )
		{
			return;
		}
		this.remPlayerByName( data.name )
	},
	
	'addPlayer':function( data )
	{
		var pname, line, user, ateam, aiNum;
		pname = data.name;

		if( pname === '' )
		{
			return;
		}
		if( data.battleId !== this.battleId )
		{
			return;
		}
		this.addPlayerByName( pname )
	},
	
	'joinBattle':function( data )
	{
		var blistStore = this.battleListStore;
		var smsg;

		this.battleId = data.battleId;
		
		this.playerNum = 0;
		this.aiNum = 0;
		
		domStyle.set( this.hideBattleNode, 'display', 'none' );
		domStyle.set( this.battleDivNode, 'display', 'block' );

		this.updatePlayState();

		this.closeNode.set('disabled', false);

		this.resizeAlready(); //for startup

		if( typeof data.gameHash !== 'undefined' )
		{
			this.gameHash = data.gameHash;
		}
		this.hosting = false;
		if( typeof data.hosting !== 'undefined' )
		{
			this.hosting = data.hosting;
		}
		if( this.hosting )
		{
			smsg = 'SETSCRIPTTAGS game/startpostype=2';
			topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		}
		else
		{
			this.startGettingSourcePort();
		}
		
		
		domStyle.set( this.pollNode, 'display', 'none' );
		
		this.inBattle = true;
		//this.scriptPassword = data.scriptPassword;

		this.gameWarningIconDiv = domConstruct.create('span', {} );
		this.gameWarningIcon = domConstruct.create('img', {
			'src':'img/warning.png',
			'height':'16',
			//'title': title goes here
		}, this.gameWarningIconDiv);
		
		var item;
		item = blistStore.get(data.battleId);
		
		if( typeof item === 'undefined' )
		{
			return;
		}
		var members, playerlist, title, player_name;
		members 		= parseInt( item.members );
		playerlist 		= item.playerlist;
		this.host		= item.host;
		this.map		= item.map;
		title			= item.title;
		this.game 		= item.game;
		this.ip 		= item.ip;
		this.hostPort 	= item.hostport;
		this.natType	= item.natType;
		
		//this.engine		= this.extractEngineVersion(title)
		this.engine		= item.engineVersion;

		setTimeout( lang.hitch(this, function(){
			this.setSync();
		}), 100);
		this.setTitle( title )
		
		
		this.battleMap.setMap( this.map );

		for(player_name in playerlist)
		{
			this.addPlayer( { 'battleId':this.battleId, 'name':player_name } )
		}

		this.resizeAlready();
		this.loadedBattleData = true;
		
		this.runningGame = this.players[this.host].isInGame;
		
		var node = this.startGameButton.domNode
		domStyle.set( this.progressIconDiv, 'display', this.runningGame ? 'inline' : 'none' );
		if( this.runningGame )
		{
			Tooltip.show("Battle is in progress. Click here to launch the game.", node, ['below'], true);
			on.once(node, mouse.leave, function(){
				Tooltip.hide(node);
			})
			setTimeout(function(){
				Tooltip.hide(node);
			}, 120000);
		}
		
	}, //joinBattle
	
	'leaveBattle':function()
	{
		var smsg;
		this.spads = false;
		smsg = 'LEAVEBATTLE'
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		this.closeBattle();
	},
	
	'setSync':function()
	{
		var mapChecksum, gameHash, mapDownloadProcessName, getGame;
		this.gotMap = false;
		this.gameHashMismatch = false;
		this.recentAlert = false;
		
		if( !this.inBattle )
		{
			return;
		}
			
		//engine test
		//this.getUnitsync()
		if( this.getUnitsync() !== null )
		{
			this.gotEngine = true;
			this.hideEngineDownloadBar();
		}
		else
		{
			//this.downloadManager.downloadEngine(this.engine);
			this.showEngineDownloadBar();
			this.updateGameWarningIcon();
			return //don't continue if no engine
		}
		
		if( !this.gotGame )
		{
			getGame = false;
			//this.gameIndex = this.downloadManager.getGameIndex(this.game, this.engine);
			this.gameIndex = this.getGameIndex();
			
			if( this.gameIndex !== false )
			{
				gameHash = this.getUnitsync().getPrimaryModChecksum( this.gameIndex )
				console.log( 'Game hashes: ', this.gameHash, gameHash)
				if( this.gameHash === 0 || this.gameHash === gameHash )
				//if( this.gameHash === gameHash ) //try to download game even if host gamehash is 0, but this will try to download every time you click refresh
				{
					this.gotGame = true;
				}
				else
				{
					this.gameHashMismatch = true;
					getGame = true;
				}
			}
			else
			{
				getGame = true;
			}
			if( getGame )
			{
				this.gameDownloadProcessName = this.downloadManager.downloadPackage( 'game', this.game );
				this.showGameDownloadBar();
			}
		}
		
		if( this.gotGame )
		{
			this.loadModOptions();
			this.loadGameBots();
			this.loadFactions();
			this.hideGameDownloadBar();
		}
		
		mapChecksum = this.getMapChecksum();
		if( mapChecksum !== false )
		{
			this.mapHash = mapChecksum;
			this.gotMap = true;
			this.battleMap.hideBar();
		}
		else
		{
			mapDownloadProcessName = this.downloadManager.downloadPackage( 'map', this.map );
			this.battleMap.showBar(mapDownloadProcessName)
		}
		this.battleMap.setGotMap( this.gotMap );
		this.updateGameWarningIcon();
		
		this.synced = ( this.gotGame && this.gotMap && this.gotEngine );
		
	}, //setSync
	
	'ring':function( data )
	{
		var name, line, smsg;
		name = data.name;
		line = '*** ' + name + ' is ringing you!';
		this.addLine( line, '' );
		if( this.synced )
		{
			return;
		}
		smsg = this.saystring + ' ';
		if( !this.gotEngine )
		{
			smsg += 'Downloading engine... ';
			
		}
		if( !this.gotGame )
		{
			smsg += 'Downloading game - ' + this.gameDownloadBar.get('progress') + '%. ';
		}
		if( !this.gotMap )
		{
			smsg += 'Downloading map - ' + this.battleMap.mapDownloadBar.get('progress') + '%. ';
		}
		
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
	},

	'updateGameWarningIcon':function()
	{
		var warningTitle;
		
		if( this.gameWarningIconDiv === null ) //not used in single player room
		{
			return;
		}
		
		if( this.gotGame )
		{
			domStyle.set( this.gameWarningIconDiv, {'display':'none'} );
			return;
		}
		
		domStyle.set( this.gameWarningIconDiv, {'display':'inline'} );
		if( !this.gotEngine )
		{
			warningTitle = 'The engine is still downloading.'
		}
		else if( this.gameHashMismatch )
		{
			warningTitle = 'Your game does not match the host\s! It will be redownloaded.'
		}
		else
		{
			warningTitle = 'You do not have this game, it will be downloaded.';
		}
		domAttr.set( this.gameWarningIcon, 'title', warningTitle );
		
	},
	
	
		
	'newBattleAdvancedToggle':function()
	{
		var showingAdvanced;
		showingAdvanced = domStyle.get( this.newBattleAdvancedDiv, 'display' ) === 'table-row';
		domStyle.set( this.newBattleAdvancedDiv, 'display', showingAdvanced ? 'none' : 'table-row');
		this.newBattleAdvancedButton.set('label', (showingAdvanced ? 'Show' : 'Hide') + ' Advanced Options');
	},
	'updateRapidTag':function(val)
	{
		this.newBattleRapidTag.set( 'value', val );
	},
	
	playMission:function(data)
	{
		var url;
		var missionName;
		var missionId;
		var missionMatch;
		// SAIDPRIVATE Nightwatch !JSON SiteToLobbyCommand {"SpringLink":"http://zero-k.info/Missions/Detail/140@start_mission:Tutorial - Running Start r169"}
		url = data.SpringLink
		console.log('play mission', url)
		missionName = '';
		missionMatch = url.match(/@start_mission:(.*)/);
		if( missionMatch )
		{
			missionName = missionMatch[1];
			if( missionName !== '' )
			{	
				if( missionName.substr(missionName.length-1, 1) === ')' ) //temp fix
				{
					missionName = missionName.substr(0, missionName.length-1); 
				}
				this.spawnSpringieBattle( missionName, 'Mission: ' + missionName, '', true ); //4th param = modOnly, for missions to work
			}
			return;
		}
		
		missionMatch = url.match(/Detail\/(.*)@start_script_mission:/);
		if( missionMatch )
		{
			missionId = missionMatch[1];
			xhr('getmissionscript.suphp', {
				query:{scriptId:missionId},
				handleAs:'json',
				sync:true
			}).then(
				lang.hitch(this, function(data){
					console.log(data)
					var script = data.script;
					script = script.replace( '%MAP%', data.map );
					//script = script.replace( '%MOD%', data.rapidTag );
					this.scriptMissionScript = data.script;
					this.spawnSpringieBattle( data.rapidTag, 'Mission: ' + missionName, '', true ); //4th param = modOnly, for missions to work
				})
			);
		}
		
	},
	
	createGameButtonClick:function()
	{
		var smsg, springie, foundSpringie, i;
		var newBattlePassword;
		var mapName;
		var gameName;
		var battleType;
		
		newBattlePassword = this.newBattlePassword.value;
		
		if( this.hostTabShowing === 'directHostingTab' || this.hostTabShowing === 'replayHostingTab' )
		{
			if( this.hostTabShowing === 'directHostingTab' )
			{
				battleType = 0;
				this.gameHash = this.getUnitsync().getPrimaryModChecksum( this.gameSelect.value )
				mapName = 'Small_Divide-Remake-v04';
				gameName = this.gameSelect.get('displayedValue');
			}
			else
			{
				var replayPath, file, index, sm
				var version
				
				battleType = 1;
				replayPath = this.appletHandler.springHome + '/demos/' + this.replaySelect.get('value');
				file = this.appletHandler.applet.ReadFileMore( replayPath, 1000 );
				
				index = file.indexOf("[game]");
				sm = new ScriptManager({});
				//console.log (index); console.log (replayPath);
				sm.descriptify( file, '', index )
				//echo( sm.scriptTree )
				
				version = file.match(/\-> Version: ([\d\.]*)/);
				version = version[1];
				this.engine = version;
				
				this.gameHash = 0;
				gameName = sm.scriptTree.game.gametype;
				mapName = sm.scriptTree.game.mapname;
				
			}
			
			this.maphash = 0;
			if( newBattlePassword === '' )
			{
				newBattlePassword = '*';
			}
			
			
			//NAT traversal method used by the host. Must be one of: 0: none 1: Hole punching 2: Fixed source ports
			var natType;
			var internalSourcePortIp;
			
			natType = this.holePunchingCheck.get('checked') ? '1' : '0';
			internalSourcePortIp = this.appletHandler.sendSomePacket();
			//this.hostPort = 8452;
			this.hostPort = internalSourcePortIp;
			
			smsg = 'OPENBATTLEEX '+ battleType +' ' + natType + ' '+newBattlePassword+' ' + this.hostPort + ' 16 '+this.gameHash+' 0 ' +this.maphash
				+ ' spring ' + this.engine + ' ' + mapName + '\t' + this.newBattleName.value + '\t' + gameName;
			topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
			
			
			
			if( this.hostTabShowing === 'replayHostingTab' )
			{
				/*
				//this sends over 1024 bytes, throttled by server
				var replayModOptions, modoptionKey, modoptionVal;
				replayModOptions = [];
				for( modoptionKey in sm.scriptTree.game.modoptions )
				{
					modoptionVal = sm.scriptTree.game.modoptions[modoptionKey]
					replayModOptions.push( 'game/modoptions/' + modoptionKey + '=' + modoptionVal )
				}
				smsg = 'SETSCRIPTTAGS ';
				smsg += replayModOptions.join('\t');
				topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
				*/
			}
		}
		else
		{
			this.spawnSpringieBattle( this.newBattleRapidTag.value, this.newBattleName.value, newBattlePassword );
		}
		this.newBattleDialog.hide();
	
	},
	spawnSpringieBattle:function( newBattleMod, newBattleName, newBattlePassword, modOnly) //newBattleMod can be a raipd tag
	{
		var smsg, springie, foundSpringie, i;
		
		i = 0;
		while( !foundSpringie && i < 100 )
		{
			springie = 'Springiee' + (i===0 ? '' : i);
			if( springie in this.users )
			{
				foundSpringie = true;
				topic.publish( 'Lobby/setNewBattleReady', newBattlePassword );
				if( modOnly )
				{
					smsg = 'SAYPRIVATE '+springie+' !spawn mod='+ newBattleMod;
				}
				else
				{
					smsg = 'SAYPRIVATE '+springie+' !spawn mod='+ newBattleMod +',title='+ newBattleName +',password=' + newBattlePassword;
				}
				topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
			}
			i += 1;
		}
	},
	
	makeBattle:function()
	{
		if( !this.authorized )
		//if( 0 )
		{
			alert2('Please connect to the server first before creating a multiplayer battle.');
			return;
		}
		
		
		replayFiles = this.appletHandler.getReplays()
		replayOptions = [];
		array.forEach( replayFiles, function(replayFileName){
			replayOptions.push( { name: replayFileName, id:replayFileName } )
		}, this);
		this.replaySelect.set( 'queryExpr', '*${0}*' );
		this.replaySelect.set( 'highlightMatch', 'all' );
		this.replaySelect.set( 'store', new Memory({ data:replayOptions }) )
		
		
		this.newBattleDialog.show();
		this.newBattleName.set( 'value', this.nick + '\'s Game!' );
	},
	
	
	hostTabShowing:'',
	changeHostTab:function()
	{
		this.hostTabShowing = this.getShownTab()
		if( this.hostTabShowing === 'directHostingTab' )
		{
			this.updateDirectHostingForm();
		}
		domStyle.set( this.holePunchingCheck.domNode, 'display', this.hostTabShowing === 'autohostTab' ? 'none' : 'block' )
	},
	
	getShownTab:function()
	{
		var children, shownTab
		children = this.hostTabs.getChildren()
		shownTab = array.filter(children, function(tab){ return tab.get('selected'); })
		return shownTab[0].get('name');
	},
	

	'blank':null
}); });//define lwidgets/Battleroom
