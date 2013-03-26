///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////


define(
	'lwidgets/MBattleRoom',
	[
		"dojo/_base/declare",

		"dojo",
		"dijit",

		'dojo/_base/array',

		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		'dojo/on',

		'lwidgets',
		'lwidgets/BattleRoom',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now

		'dijit/ColorPalette',
		'dijit/form/Button',
		'dijit/form/TextBox',
		'dijit/Dialog',
		'dijit/ProgressBar',
		'dojox/encoding/base64'
	],
	function(declare, dojo, dijit, array,
		domConstruct, domStyle, domAttr, lang, topic, event, on,
		lwidgets, BattleRoom
	){
	return declare( [ BattleRoom ], {
	
	'postCreate3':function()
	{
		this.subscribe('Lobby/battles/addplayer', 'addPlayer' );
		this.subscribe('Lobby/battles/remplayer', 'remPlayer' );
		this.subscribe('Lobby/battle/playermessage', 'playerMessage' );
		this.subscribe('Lobby/battles/updatebattle', 'updateBattle' );
		this.subscribe('Lobby/battle/checkStart', 'checkStart' );
		this.subscribe('Lobby/unitsyncRefreshed', 'unitsyncRefreshed' );
		this.subscribe('Lobby/download/processProgress', 'updateBar' );
		//this.subscribe('Lobby/battle/editBot', 'editBot' );

		this.subscribe('Lobby/battle/ring', 'ring' );
	},
	
	'sendPlayState':function()
	{
		if( this.battleId !== 0 && this.gotStatuses )
		{
			this.users[this.nick].setStatusVals({
				'isSpectator':this.specState,
				'allyNumber':this.allianceId,
				'teamNumber':this.getEmptyTeam(this.nick),
				'syncStatus':this.synced ? 'Synced' : 'Unsynced',
				'side':this.faction,
				'isReady':true
			});
			this.users[this.nick].sendBattleStatus();

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

		this.battleId = data.battleId;
		
		this.playerNum = 0;
		this.aiNum = 0;
		
		domStyle.set( this.hideBattleNode, 'display', 'none' );
		domStyle.set( this.battleDivNode, 'display', 'block' );

		this.sendPlayState();

		this.closeNode.set('disabled', false);

		this.resizeAlready(); //for startup

		this.gameHash = data.gameHash;
		
		this.inBattle = true;
		//this.scriptPassword = data.scriptPassword;

		this.gameWarningIconDiv = domConstruct.create('span', {} );
		this.gameWarningIcon = domConstruct.create('img', {
			'src':'img/warning.png',
			'height':'16',
			//'title': title goes here
		}, this.gameWarningIconDiv);
		
		blistStore.fetchItemByIdentity({
			'identity':data.battleId,
			'scope':this,
			'onItem':function(item)
			{
				var members, playerlist, title, player_name;
				members 		= parseInt( blistStore.getValue(item, 'members') );
				playerlist 		= blistStore.getValue(item, 'playerlist');
				this.host		= blistStore.getValue(item, 'host');
				this.map		= blistStore.getValue(item, 'map');
				title			= blistStore.getValue(item, 'title');
				this.game 		= blistStore.getValue(item, 'game');
				this.ip 		= blistStore.getValue(item, 'ip');
				this.hostPort 	= blistStore.getValue(item, 'hostport');
				
				//this.engine		= this.extractEngineVersion(title)
				this.engine		= blistStore.getValue(item, 'engineVersion');

				this.setSync();
				this.setTitle( title )
				
				
				this.battleMap.setMap( this.map );

				for(player_name in playerlist)
				{
					this.addPlayer( { 'battleId':this.battleId, 'name':player_name } )
				}

				this.resizeAlready();
				this.loadedBattleData = true;
			}
		});

	}, //joinBattle
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
		smsg = 'SAYBATTLE '
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
	

	'blank':null
}); });//define lwidgets/Battleroom
