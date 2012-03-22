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
		
		'lwidgets',
		'lwidgets/PlayerList',
		
		//extras
		
		'dojox/grid/DataGrid'
		
	],
	function(declare, dojo, dijit, lwidgets, PlayerList ){
	return declare( [ PlayerList ], {


	'ateams':null,
	'ateamNumbers':null,
	
	'buildRendering':function()
	{
		var div1, layout;
		
		this.ateams = {};
		//div1 = dojo.create('div', {  'style':{'width':'100%', 'height':'100%', 'position':'absolute', 'right':'0px', 'top':'0px', 'minHeight':'200px' }});
		div1 = dojo.create('div', {'style':{'width':'100%', 'height':'100%'}});
		this.domNode = div1;
		layout = [
			{	field: 'main',
				name: 'Players',
				width: (200 - 20) + 'px',
				formatter: function(valueStr)
				{
					var value, lobbyClient, setAlliancePublisher;
					value = eval( '(' + valueStr + ')' );
					
					if( value.isTeam )
					{
						//cannot(?) add member functions into this formatter, unfortunately. string only.
						setAlliancePublisher = " dojo.publish('Lobby/battle/setAlliance', [{ 'allianceId':'"+value.teamNum+"' }]  ) ";
						return '<div style="color:black; text-align:center; ">'
							+ '<button style="width:100%; " onclick="'+setAlliancePublisher+';" >'
							+ value.name
							+ '</button>'
							+ '</div>'
							;	
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
					
					return '<span style="color:black; ">'
						//+ '<div style="background-color:#'+value.color+'; border:1px solid #'+value.color+'; text-shadow:1px 1px white; " >'
						+ '<div style="border:2px solid #'+value.color+'; " >'
							+ ( (value.country === '??')
								? '<img src="img/flags/unknown.png" title="Unknown Location" width="16"> '
								: '<img src="img/flags/'+value.country.toLowerCase()+'.png" title="'+value.country+'" width="16"> '
							  )
							+ '<img src="img/'+value.icon+'" title="'+value.iconTitle+'" width="16"> '
							+ '<img src="img/'+ (value.isSynced ? 'synced.png' : 'unsynced.png')
								+ '" title="' + (value.isSynced ? 'Synced' : 'Unsynced') + '" width="16" />'
						
						+ value.name
						+ (value.isAdmin ? ' <img src="img/wrench.png" align="right" title="Administrator" width="16">' : '')
						+ lobbyClient
						+ (value.isInGame ? ' <img src="img/battle.png" align="right" title="In a game since '
						   + value.inGameSince + '" width="16">' : '')
						+ (value.isAway ? ' <img src="img/away.png" align="right" title="Away since '
							+ value.awaySince +'" width="16">' : '')
						
						+ '</div>' 
						
						
						+ '</span>'
						;
				}
			}
        ];
		
		this.setupStore();
		
		this.grid = new dojox.grid.DataGrid({
			'query': {
                'main': '*'
            },
			
			'canSort':function(){return false;},
			'sortIndex':1,
			'sortInfo':1,
			
			'queryOptions':{'ignoreCase': true},
            'store': this.store,
            //'clientSort': true,
            'rowSelector': '5px',
            'structure': layout,
			'autoHeight':false,
			'autoWidth':false,
			'height':'100%',
			'onRowDblClick':dojo.hitch(this, 'queryPlayerlistItem')
		} ).placeAt(div1);
		dojo.subscribe('Lobby/battle/playerstatus', this, 'updateUser' );
		
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
		this.grid.resize();
		this.grid.update();
		this.saveStore();
	},
	
	'postCreate':function()
	{
		dojo.subscribe('Lobby/connecting', this, 'empty' );
		this.postCreate2();
	},
	
	'setAlliance':function(allianceId)
	{
		dojo.publish('Lobby/battle/setAlliance', [{ 'allianceId':allianceId }]  );
	},

	'queryPlayerlistItem':function( e )
	{
		var row, name;
		row = this.grid.getItem(e.rowIndex);
		if(  row.isTeam && row.isTeam[0] )
		{
			this.setAlliance( row.teamNum[0] )
			return;
		}
		name = row.name[0];
		dojo.publish('Lobby/chat/addprivchat', [{'name':name, 'msg':'' }]  );
		
		setTimeout( function(){ dojo.publish('Lobby/focuschat', [{'name':name, 'isRoom':false }] ); }, 500 );
	},
	
	'addTeam':function(ateamNum, spec)
	{
		var ateamItem, ateamStringSort, ateamStringName, ateamNumPlus, ateamNum2;
		
		if(ateamNum === null || ateamNum === undefined )
		{
			return;
		}
		ateamNum2 = parseInt( ateamNum );
		
		if( isNaN( ateamNum2 ) ) //fixme, why would this happen
		{
			return;
		}
		
		ateamNumPlus = ateamNum2 + 1;
		ateamStringSort = ateamNumPlus + 'A'
		if( ateamNumPlus < 10 )
		{
			ateamStringSort = '0' + ateamStringSort;
		}
		
		ateamStringName = 'Team ' + ateamNumPlus;
		
		if(spec)
		{
			ateamStringSort = 'SA';
			ateamStringName = 'Spectators'
		}
		
		if( this.ateams[ateamStringName] )
		{
			return;
		}
		
		this.ateams[ateamStringName] = true;
		ateamItem = {
			'team':'Team ' + ateamStringSort,
			'name':'<>Team ' + ateamStringSort,
			'isTeam':true,
			'teamNum' : (spec ? 'S' : ateamNum2),
			'main':JSON.stringify( {
				'team' : 'Team ' + ateamStringSort,
				'name': ateamStringName,
				'isTeam' : true,
				'teamNum' : (spec ? 'S' : ateamNum2)
			} )
		}
		this.store.newItem( ateamItem );
		//this.store.save(); //must be done after add/delete!
		this.saveStore(); //must be done after add/delete!
		
	},
	
	'addUser':function(user)
	{
		this.addTeam( user.allyNumber, user.isSpectator );
		user.main = this.setupDisplayName(user);
		this.store.newItem( user );
		this.saveStore(); //must be done after add/delete!
	},
	
	'removeUser':function(user)
	{
		this.store.fetchItemByIdentity({
			'identity':user.name,
			'scope':this,
			'onItem':function(item)
			{
				if( item )
				{
					this.store.deleteItem(item);
					this.saveStore(); //must be done after add/delete!		
				}
			}
		});
		
	},
	
	'updateUser':function( data )
	{
		var name, user;
		name = data.name;
		user = data.user;
		
		user.main = this.setupDisplayName(user);
		
		this.addTeam( user.allyNumber, user.isSpectator );
		
		
		//fixme: maybe just pull user from users instead?
		this.store.fetchItemByIdentity({
			'identity':user.name,
			'scope':this,
			'onItem':function(item)
			{
				if( item )
				{
					for(attr in user){
						if( user.hasOwnProperty(attr) )
						{
							if(attr !== 'name' )
							{
								this.store.setValue(item, attr, user[attr]);
							}
						}
						else
						{
							//console.log('Error #11 - ' + attr);
						}
					}
					
					this.saveStore(); //must be done after add/delete!
				}
			}
		});
	},
	
	'setupDisplayName':function(user)
	{
		var icon, title, teamString, teamNumPlus;
		
		
		teamNumPlus = user.allyNumber + 1;
		
		icon = 'smurf.png'; title = 'Spectator';
		if( !user.isSpectator )	{ icon = 'soldier.png';		title = 'Player'; }
		if( user.owner )			{ icon = 'robot.png';		title = 'Bot'; 				}
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
			'name': user.toString(),
			'isAdmin' : user.isAdmin,
			'country': user.country,
			'cpu' : user.cpu,
			'bot' : (user.owner ? true : false),
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
		
	},
	
	'postCreate2':function()
	{
		//dojo.subscribe('Lobby/battle/playerstatus', this, 'playerStatus' );
	},
	
	
	'blank':null
}); });//declare lwidgets.BattlePlayerList2
