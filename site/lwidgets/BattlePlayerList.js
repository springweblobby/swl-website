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
		'dojo/dom-construct',
		'dojo/_base/array',
		
		'lwidgets',
		'lwidgets/UserList',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now
		'dijit/layout/ContentPane',
		
	],
	function(declare, dojo, dijit, lang,
		topic, domConstruct, array,
		lwidgets, UserList, 
		
		Memory, Observable,
		Grid, Selection, ColumnResizer
		){
	return declare( [ UserList ], {


	'ateams':null,
	'ateamNumbers':null,
	'nick':'',
	
	'local':false,
	
	'buildRendering':function()
	{
		var div1, layout;
		
		this.local = this.battleRoom.local;
		
		
		this.ateams = {};
		if( !this.style )
		{
			this.style = {};
		}
								
		div1 = dojo.create('div', {'style':this.style});
		this.domNode = div1;
		layout = [
			{	'field': 'battleMain',
				'sortable':false,
				'renderHeaderCell':function (node)
				{
					return domConstruct.create('span',{'style':{'fontSize':'medium'}, 'innerHTML':'Players' } );
				},
				//width: (170) + 'px',
				//formatter: lang.hitch(this, function(valueStr)
				'renderCell': lang.hitch( this, function (object, valueStr, cell)
				{
					var value, lobbyClient, setAlliancePublisher, botEditButton, div,
						teamButton, newTeamButton, clearTeamsButton,
						botButton, spectators;
					var divContent;
					var country;
					
					value = eval( '(' + valueStr + ')' );
					
					if( value.isTeam )
					{
						spectators = value.name === 'Spectators';
						div = domConstruct.create( 'div', { 'style':{'textAlign':'center','padding':'2px' } } );
						teamButton = new dijit.form.Button({
							'label':value.name,
							'iconClass': spectators ? 'smallIcon searchImage' : 'smallIcon flagImage',
							'onClick':lang.hitch(this, function(){
								this.setAlliance( value.teamNum );
							})
						}).placeAt(div);
						
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
							}).placeAt(div);
							clearTeamsButton = new dijit.form.Button({
								'label':'Clear empty teams',
								'showLabel':false,
								'iconClass': 'smallIcon flagMinusImage',
								'onClick':lang.hitch(this, function(){
									var emptyAllyTeams, items;
									emptyAllyTeams = this.battleRoom.getEmptyAllyTeams();
									items = this.store.query({'teamNum':new RegExp('('+emptyAllyTeams.join('|')+')')})
									array.forEach(items, function(item){
										var teamName;
										teamName = this.store.get(item.id).teamNum + '';
										this.ateams[teamName] = null;
										delete this.ateams[teamName];
										this.store.remove(item.id);
											
									}, this)
								})
							}).placeAt(div);
						}
						else
						{
							botButton = new dijit.form.Button({
								'label':'Add a bot to this team',
								'showLabel':false,
								'iconClass': 'smallIcon botPlusImage',
								'onClick':lang.hitch(this, 'showGameBots', value.teamNum)
							}).placeAt(div);
						}
						
						return div;
					}
					
					lobbyClient = '';
					if(value.cpu === '7777')
					{
						lobbyClient = ' <img src="img/blobby.png" align="right" title="Using Spring Web Lobby" width="16">'
					}
					else if(value.cpu === '6666' || value.cpu === '6667' )
					{
						lobbyClient = ' <img src="img/zk_logo_square.png" align="right" title="Using Zero-K Lobby" width="16">'
					}
					country = value.country in countryCodes ? countryCodes[value.country] : 'country not found';
					
					divContent = ''
						
						//+ '<div style="background-color:#'+value.color+'; border:1px solid #'+value.color+'; text-shadow:1px 1px white; " >'
						+ ( (value.country === '??')
							? '<img src="img/flags/unknown.png" title="Unknown Location" width="16"> '
							: '<img src="img/flags/'+value.country.toLowerCase()+'.png" title="'+country+'" width="16"> '
						  )
						+ '<img src="img/'+value.icon+'" title="'+value.iconTitle+'" width="16"> '
						
						+ '<span style="background-color:#'+value.color+'; border:1px solid #'+value.color+'; ">'
							+ '<img src="img/'+ (value.isSynced ? 'synced.png' : 'unsynced.png')
								+ '" title="' + (value.isSynced ? 'Synced' : 'Unsynced') + '" width="12" />'
						+ '</span>'
						+ '<span style="color:black; ">&nbsp;' + value.displayName + '</span>'
						
						+ lobbyClient
						+ (value.isAdmin ? ' <img src="img/wrench.png" align="right" title="Administrator" width="16">' : '')
						+ (value.isInGame ? ' <img src="img/battle.png" align="right" title="In a game since ' + value.inGameSince + '" width="16">' : '')
						+ (value.isAway ? ' <img src="img/away.png" align="right" title="Away since ' + value.awaySince +'" width="16">' : '')
					;
					
					div = domConstruct.create( 'div', {'innerHTML':divContent, 'style':{'padding':0} } );
					if( value.botOwner === this.nick )
					{
						botEditButton = new dijit.form.Button({
							'iconClass':'smallIcon settingsImage',
							'showLabel':false,
							'label':'Edit Bot',
							//'onClick':function(){topic.publish('Lobby/battle/editBot', { 'botName':value.name } ) }
							'onClick':lang.hitch(this, function(){this.battleRoom.editBot( value.name ); } )
						}).placeAt(div);
						
						botRemoveButton = new dijit.form.Button({
							'iconClass':'smallIcon closeImage',
							'showLabel':false,
							'label':'Remove Bot',
							'onClick':lang.hitch(this, function(){
								var smsg;
								if( this.local )
								{
									this.battleRoom.remPlayerByName( '<BOT>' + value.name );
								}
								else
								{
									smsg = 'REMOVEBOT ' + value.name;
									topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
								}
							})
						}).placeAt(div);
					}
					return div;
				})//hitch
			}
        ];
		
		domConstruct.create('style', {'innerHTML':' .dgrid-cell-padding {  padding:0; } .field-battleMain { width: 220px; } ' }, div1 );
		
		this.setupStore();
		ResizeGrid = declare([Grid, Selection, ColumnResizer]);
		this.grid = new ResizeGrid({
			/*
			'query': { 'main': '*' },
			'queryOptions':{'ignoreCase': true},
			*/
			'store': this.store,
            'columns': layout,
		}, domConstruct.create('div', {'style':{ 'height':'100%', 'width':'100%', /*doesnt help*/'minHeight':'50px' }}, div1) ); // no placeAt because not dijit
		this.grid.set('sort', 'battleMain');
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'queryPlayer') );
		
		this.subscribe('Lobby/battle/playerstatus', 'updateUser' );
		this.subscribe('SetNick', function(data){ this.nick = data.nick } );
		
		
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
			'battleMain':JSON.stringify( {
				'team' : 'Team ' + ateamStringSort,
				'name': ateamStringName,
				'isTeam' : true,
				'teamNum' : ateamShortName
			} )
		}
		ateamItem.id = ateamItem.name;
		this.store.put( ateamItem );
		
	},
	
	'addUser':function(user)
	{
		this.addTeam( user.allyNumber, user.isSpectator );
		
		user.battleMain = this.setupDisplayName(user);
		user.id = user.name;
		this.store.put( user );
	},
	
	
	'updateUser':function( data )
	{
		var name, user;
		name = data.name;
		user = data.user;
		
		if( user.battleId !== this.battleRoom.battleId )
		{
			return;
		}
		
		this.addTeam( user.allyNumber, user.isSpectator );
		
		user.battleMain = this.setupDisplayName(user);
		this.store.notify( user, name )
	},
	
	'setupDisplayName':function(user)
	{
		var icon, title, teamString, teamNumPlus, skill, elo;
		
		skill = ( user.skill !== '' ) ?  ' - Skill: ' + user.skill : '';
		elo = ( user.elo !== '' ) ?  ' - Elo: ' + user.elo : '';
		
		teamNumPlus = user.allyNumber + 1;
		
		icon = 'smurf.png'; title = 'Spectator';
		if( !user.isSpectator )	{ icon = 'soldier.png';		title = 'Player' + skill + elo; }
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
			'nameLower': user.name.toLowerCase(),
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
		var items;
		this.ateams = {};
		items = this.store.query({'id': new RegExp('.*') });
		array.forEach(items, function(item){
			this.store.remove(item.id)
		}, this)
		//this.store.setData([])
	},
	
	'postCreate2':function()
	{
		//this.subscribe('Lobby/battle/playerstatus', 'playerStatus' );
	},
	
	
	'blank':null
}); });//declare lwidgets.BattlePlayerList2
