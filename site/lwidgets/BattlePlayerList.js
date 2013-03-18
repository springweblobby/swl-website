///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/BattlePlayerList',
	[
		"dojo/_base/declare",
		
		"dojo",
		"dijit",
		
		'dojo/_base/lang',
		'dojo/topic',
		
		'lwidgets',
		'lwidgets/UserList',
		'dojox/grid/DataGrid',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now
		'dijit/layout/ContentPane',
		
	],
	function(declare, dojo, dijit, lang,
		topic,
		lwidgets, UserList, DataGrid ){
	return declare( [ UserList ], {


	'ateams':null,
	'ateamNumbers':null,
	'nick':'',
	
	'local':false,
	
	'buildRendering':function()
	{
		var div1, layout;
		
		this.local = this.battleRoom.local;
		
		this.items = {};
		
		this.ateams = {};
		if( !this.style )
		{
			this.style = {};
		}
								
		div1 = dojo.create('div', {'style':this.style});
		this.domNode = div1;
		layout = [
			{	field: 'main',
				name: '<span style="font-size:medium; ">Players</span>',
				width: (170) + 'px',
				formatter: lang.hitch(this, function(valueStr)
				{
					var value, lobbyClient, setAlliancePublisher, botEditButton, div,
						teamButton, newTeamButton, clearTeamsButton,
						botButton, spectators;
					value = eval( '(' + valueStr + ')' );
					
					if( value.isTeam )
					{
						spectators = value.name === 'Spectators';
						div = new dijit.layout.ContentPane( { 'style':{'textAlign':'center','padding':'2px' } } );
						teamButton = new dijit.form.Button({
							'label':value.name,
							'iconClass': spectators ? 'smallIcon searchImage' : 'smallIcon flagImage',
							'onClick':lang.hitch(this, function(){
								this.setAlliance( value.teamNum );
							})
						}).placeAt(div.domNode);
						
						if( spectators )
						{
							newTeamButton = new dijit.form.Button({
								'label':'Add a new team',
								'showLabel':false,
								'iconClass': 'smallIcon flagPlusImage',
								'onClick':lang.hitch(this, function(){
									var i, curTeam, emptyTeam;
									for(i=0; i<16; i++)
									{
										curTeam = i+'';
										if( !( curTeam in this.ateams ) )
										{
											this.addTeam(i, false)
											return;
										}
									}
									
								})
							}).placeAt(div.domNode);
							clearTeamsButton = new dijit.form.Button({
								'label':'Clear empty teams',
								'showLabel':false,
								'iconClass': 'smallIcon flagMinusImage',
								'onClick':lang.hitch(this, function(){
									var emptyAllyTeams;
									emptyAllyTeams = this.battleRoom.getEmptyAllyTeams();
									this.store.fetch({
										'query':{
											'teamNum':new RegExp('('+emptyAllyTeams.join('|')+')')
										},
										'scope':this,
										'onItem':function(item)
										{
											var teamNum, teamName;
											if( item )
											{
												teamName = this.store.getValue(item, 'teamNum') + '';
												this.ateams[teamName] = null;
												delete this.ateams[teamName];
												this.store.deleteItem(item);
												this.saveStore(); //must be done after add/delete!		
											}
										}
									})
								})
							}).placeAt(div.domNode);
						}
						else
						{
							botButton = new dijit.form.Button({
								'label':'Add a bot to this team',
								'showLabel':false,
								'iconClass': 'smallIcon botPlusImage',
								'onClick':lang.hitch(this, 'showGameBots', value.teamNum)
							}).placeAt(div.domNode);
						}
						
						return div;
					}
					
					lobbyClient = '';
					if(value.cpu === '7777')
					{
						lobbyClient = ' <img src="img/blobby.png" align="right" title="Using Spring Web Lobby" width="16">'
					}
					else if(value.cpu === '6666')
					{
						lobbyClient = ' <img src="img/zk_logo_square.png" align="right" title="Using Zero-K Lobby" width="16">'
					}
					
					var divContent = ''
						
						//+ '<div style="background-color:#'+value.color+'; border:1px solid #'+value.color+'; text-shadow:1px 1px white; " >'
						+ ( (value.country === '??')
							? '<img src="img/flags/unknown.png" title="Unknown Location" width="16"> '
							: '<img src="img/flags/'+value.country.toLowerCase()+'.png" title="'+value.country+'" width="16"> '
						  )
						+ '<img src="img/'+value.icon+'" title="'+value.iconTitle+'" width="16"> '
						
						+ '<span style="background-color:#'+value.color+'; border:1px solid #'+value.color+'; ">'
							+ '<img src="img/'+ (value.isSynced ? 'synced.png' : 'unsynced.png')
								+ '" title="' + (value.isSynced ? 'Synced' : 'Unsynced') + '" width="16" />'
						+ '</span>'
						+ '<span style="color:black; ">'	
							+ '&nbsp;' + value.displayName
						+ '</span>'
						
						+ (value.isAdmin ? ' <img src="img/wrench.png" align="right" title="Administrator" width="16">' : '')
						+ lobbyClient
						+ (value.isInGame ? ' <img src="img/battle.png" align="right" title="In a game since '
						   + value.inGameSince + '" width="16">' : '')
						+ (value.isAway ? ' <img src="img/away.png" align="right" title="Away since '
							+ value.awaySince +'" width="16">' : '')
					;
					
					div = new dijit.layout.ContentPane( {'content':divContent, 'style':{'padding':0} } );
					if( value.botOwner === this.nick )
					{
						botEditButton = new dijit.form.Button({
							'iconClass':'smallIcon settingsImage',
							'showLabel':false,
							'label':'Edit Bot',
							//'onClick':function(){topic.publish('Lobby/battle/editBot', { 'botName':value.name } ) }
							'onClick':lang.hitch(this, function(){this.battleRoom.editBot( value.name ); } )
						}).placeAt(div.domNode);
						
						botRemoveButton = new dijit.form.Button({
							'iconClass':'smallIcon closeImage',
							'showLabel':false,
							'label':'Remove Bot',
							'onClick':lang.hitch(this, function(){
								var smsg;
								if( this.local )
								{
									this.battleRoom.remPlayer2( '<BOT>' + value.name );
								}
								else
								{
									smsg = 'REMOVEBOT ' + value.name;
									topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
								}
							})
						}).placeAt(div.domNode);
					}
					return div;
				})//hitch
			}
        ];
		
		this.setupStore();
		
		this.grid = new DataGrid({
			'query': {
                'main': '*'
            },
			style:{'color':'black'},
			
			'canSort':function(){return false;},
			'sortIndex':1, //what's this for?
			'sortInfo':1,
			
			'queryOptions':{'ignoreCase': true},
            'store': this.store,
            //'clientSort': true,
			
			//'rowHeight':'15',
			
			//elasticView:2
			'keepRows':100,
			
            'rowSelector': '5px',
            'structure': layout,
			'autoHeight':false,
			'autoWidth':false,
			'height':'100%',
			'onRowDblClick':lang.hitch(this, 'queryPlayerlistItem')
		} );
		this.grid.placeAt(div1);
		//} )
		//var temp = new dijit.layout.ContentPane( {'content':this.grid, 'style':{'width':'100%','height':'100%' } } ).placeAt(div1)
						
		//this.grid.structure[0].width = 50;
		
		this.subscribe('Lobby/battle/playerstatus', 'updateUser' );
		this.subscribe('SetNick', function(data){ this.nick = data.nick } );
		
		
	},
	'startup2':function()
	{
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.grid.startup();
			// dojo.style( this.grid.domNode.children[0], 'display', 'none' );
			// #myGrid .dojoxGridHeader  { display:none; }
			
		}
	},
	'resizeAlready':function()
	{
		//this.grid.resize();
		//this.grid.update();
		this.saveStore();
	},
	
	'postCreate':function()
	{
		if( !this.local )
		{
			this.subscribe('Lobby/connecting', 'empty' );
		}
		this.postCreate2();
	},
	
	'showGameBots':function(team)
	{
		this.battleRoom.showGameBots(team);
	},
	
	'setAlliance':function(allianceId)
	{
		this.battleRoom.setAlliance( allianceId )
	},

	'queryPlayerlistItem':function( e )
	{
		var row, name;
		
		if( this.local )
		{
			return;
		}
		
		row = this.grid.getItem(e.rowIndex);
		if(  row.isTeam && row.isTeam[0] )
		{
			this.setAlliance( row.teamNum[0] )
			return;
		}
		name = row.name[0];
		topic.publish('Lobby/chat/addprivchat', {'name':name, 'msg':'' }  );
		
		setTimeout( function(){ topic.publish('Lobby/focuschat', {'name':name, 'isRoom':false } ); }, 500 );
	},

	
	'addTeam':function(ateamNum, spec)
	{
		var ateamItem, ateamStringSort, ateamStringName, ateamShortName, ateamNumPlus, ateamNum2;
		
		if(ateamNum === null || ateamNum === undefined )
		{
			//console.log('%%% <BattlePlayerList> Error #1')
			return;
		}
		ateamNum2 = parseInt( ateamNum );
		
		if( isNaN( ateamNum2 ) ) //fixme, why would this happen
		{
			//console.log('%%% <BattlePlayerList> Error #3')
			return;
		}
		
		ateamNumPlus = ateamNum2 + 1;
		ateamStringSort = ateamNumPlus + 'A'
		if( ateamNumPlus < 10 )
		{
			ateamStringSort = '0' + ateamStringSort;
		}
		
		ateamStringName = 'Team ' + ateamNumPlus;
		ateamShortName = ateamNum2+'';
		if(spec)
		{
			ateamStringSort = 'SA';
			ateamStringName = 'Spectators';
			ateamShortName = 'S';
		}
		
		if( this.ateams[ateamShortName] )
		{
			return;
		}
		
		this.ateams[ateamShortName] = true;
		ateamItem = {
			'team':'Team ' + ateamStringSort,
			'name':'<>Team ' + ateamStringSort,
			'isTeam':true,
			'teamNum' : ateamShortName,
			'main':JSON.stringify( {
				'team' : 'Team ' + ateamStringSort,
				'name': ateamStringName,
				'isTeam' : true,
				'teamNum' : ateamShortName
			} )
		}
		this.store.newItem( ateamItem );
		
		//this.saveStore(); //must be done after add/delete!
		setTimeout( function(thisObj){
			thisObj.saveStore(); //must be done after add/delete!
		}, 200, this );
		
	},
	
	'addUser':function(user)
	{
		this.addTeam( user.allyNumber, user.isSpectator );
		user.main = this.setupDisplayName(user);
		this.items[user.name] = this.store.newItem( user );
		this.saveStore(); //must be done after add/delete!
	},
	
	
	'updateUser':function( data )
	{
		var name, user, item;
		name = data.name;
		user = data.user;
		
		if( user.battleId !== this.battleRoom.battleId )
		{
			return;
		}
		
		item = this.items[user.name];
		if( !item )
		{
			return;
		}
		user.main = this.setupDisplayName(user);
		this.addTeam( user.allyNumber, user.isSpectator );
		for(attr in user){
			if(attr !== 'name' )
			{
				this.store.setValue(item, attr, user[attr]);
			}
		}
		this.saveStore(); //must be done after add/delete!
	},
	
	'setupDisplayName':function(user)
	{
		var icon, title, teamString, teamNumPlus;
		
		
		teamNumPlus = user.allyNumber + 1;
		
		icon = 'smurf.png'; title = 'Spectator';
		if( !user.isSpectator )	{ icon = 'soldier.png';		title = 'Player'; }
		if( user.owner )		{ icon = 'robot.png';		title = 'Bot'; }
		if( user.isHost )		{
			icon = 'napoleon.png';	title = 'Battle Host';
			if( user.isSpectator )
			{
				title = 'Battle Host; Spectating';
			}
		}
		
		teamString = teamNumPlus + 'Z'
		
		if( teamNumPlus < 10 )
		{
			teamString = '0' + teamString;
		}
		if(user.isSpectator)
		{
			teamString = 'SZ'
		}
		
		return JSON.stringify( {
			'team': 'Team ' + teamString,
			'name': user.name,
			'displayName': user.toString(),
			'isAdmin' : user.isAdmin,
			'country': user.country,
			'cpu' : user.cpu,
			'botOwner' : user.owner,
			'icon': icon,
			'iconTitle':title,
			'isInGame':user.isInGame,
			'inGameSince':user.inGameSince,
			'isSynced':user.syncStatus === 'Synced',
			'isAway':user.isAway,
			'awaySince':user.awaySince,
			'color':user.hexColor
		} );
	},
	
	'empty':function()
	{
		this.ateams = {};
		this.store.fetch({
			'query':{'name':'*'},
			'scope':this,
			'onItem':function(item)
			{
				this.store.deleteItem(item);
				this.saveStore();
			}
		});
		this.items = {};
	},
	
	'postCreate2':function()
	{
		//this.subscribe('Lobby/battle/playerstatus', 'playerStatus' );
	},
	
	
	'blank':null
}); });//declare lwidgets.BattlePlayerList2
