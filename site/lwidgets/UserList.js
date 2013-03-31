///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	'lwidgets/UserList',
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
		
		'dijit/_WidgetBase',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		
		//'dgrid/Grid',
		'dijit/layout/ContentPane',
		
		//extras
		'dojo/dom', //needed for widget.placeAt to work now
		
	],
	function(declare, dojo, dijit,
		array, domConstruct, domStyle, domAttr, lang, topic,
		WidgetBase,
		
		Memory, Observable,
		Grid, Selection, ColumnResizer,
		
		ContentPane
		
		){
	
	return declare( [ WidgetBase ], {
		
	'store':null,
	'startMeUp':true,
	
	'name':'unnamed',
	
	'buildRendering':function()
	{
		
		var div1, layout;
		var ResizeGrid;
		
		if( !this.style )
		{
			this.style = {'width':'100%', 'height':'100%' };
		}
		div1 = domConstruct.create('div', this.style );
		
		//domConstruct.create('span', { 'innerHTML':'special playerlist goes here' }, div1);
		this.domNode = div1;
		
		layout = [
			{	field: 'country',
				//label: '<img src="img/globe.png" title="Location" />',
				resizable: true,
				//width: '20px',
				//style: { width: '20px' },
				renderHeaderCell: function (node)
				{
					return domConstruct.create('img', {src:'img/globe.png', 'title': 'Location', width:16} );
				},
				renderCell: function (object, value, cell)
				{
					var cont;
					var country; //= object.country;
					country = value in countryCodes ? countryCodes[value] : 'country not found' ;
					if(value === '??')
					{
						return domConstruct.create('img', {src:'img/flags/unknown.png', 'title': 'Unknown Location', width:16} )
					}
					return domConstruct.create('img', {src:'img/flags/'+value.toLowerCase()+'.png', 'title': country, width:16} )
				}
			},
			{	field: 'main',
				label: 'Users',
				resizable: true,
				//width: (250-20-30) + 'px',
				
				renderCell: function (object, value, cell)
				{
					var value, lobbyClient;
					var div;
					var html;
					//value = eval( '(' + valueStr + ')' );
					//value = object;
					
					lobbyClient = '';
					if(object.cpu === '7777')
					{
						lobbyClient = ' <img src="img/blobby.png" align="right" title="Using Spring Web Lobby" width="16">'
					}
					else if(object.cpu === '6666' || object.cpu === '6667' )
					{
						lobbyClient = ' <img src="img/zk_logo_square.png" align="right" title="Using Zero-K Lobby" width="16">'
					}
					html = '<span style="color:black; ">'
						+ '<img src="img/'+object.icon+'" title="'+object.iconTitle+'" width="16"> '
						+ object.name
						
						+ lobbyClient
						+ (object.isAdmin ? ' <img src="img/wrench.png" align="right" title="Administrator" width="16">' : '')
						
						+ (object.isInGame ? ' <img src="img/battle.png" align="right" title="In a game since ' + object.inGameSince + '" width="16">' : '')
						+ (object.isAway ? ' <img src="img/away.png" align="right" title="Away since ' + object.awaySince +'" width="16">' : '')
						
						+ '</span>'
						;
					div = domConstruct.create( 'div', { 'style':{'padding':'0px' }, 'innerHTML':html} );
					return div;
				}
			},
			{	field: '',
				label: '',
			}
        ];
		
		domConstruct.create('style', {'innerHTML':''
			+ ' .dgrid-cell-padding {  padding:0; } '
			+ '.field-country { width: 30px; text-align:center; vertical-align:middle; } '
			+ '.field-main { width: 220px; } '
		 }, div1 );
		//domConstruct.create('style', {'innerHTML':' .field-main { width: 150px; } ' }, this.domNode );
		
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
		this.grid.set('sort', 'main');
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'queryPlayer') );
		this.subscribe('Lobby/battle/playerstatus', 'updateUser' );
		
	},
	
	'setupStore':function()
	{
		this.store = Observable( new Memory({data:[], identifier:'id'}) );
	},
	
	'startup2':function()
	{
		if( this.startMeUp )
		{
			if( this.grid.domNode.clientHeight > 0 )
			{
				this.startMeUp = false;
				this.grid.startup();
			}
			
		}
	},
	
	
	'resizeAlready':function()
	{
		this.startup2();
	},
	
	'postCreate':function()
	{
		this.subscribe('Lobby/connecting', 'empty' );
		this.postCreate2();
	},
	
	'postCreate2':function()
	{
	},

	'queryPlayer':function( e )
	{
		var row, name;
		row = this.grid.row(e);
		name = row.id;
		topic.publish('Lobby/chat/addprivchat', {'name':name, 'msg':'' }  );
		
		topic.publish('Lobby/focuschat', {'name':name, 'isRoom':false }  );
	},
	
	
	'addUser':function(user)
	{
		var icon, iconTitle;
		icon = 'smurf.png'; iconTitle = 'User';
		user.icon = icon;
		user.iconTitle = iconTitle
		user.main = user.name.toLowerCase();
		user.id = user.name;
		this.store.put( user );
	},
	
	'removeUser':function(user)
	{
		this.store.remove( user.name );
	},
	
	'updateUser':function( data )
	{
		var name, user;
		var icon, iconTitle;
		name = data.name;
		user = data.user;
		
		if( user.local )
		{
			return;
		}
		if( typeof this.store.get(name) === 'undefined' )  //calling store.notify will add a user if it doesn't exist
		{
			return;
		}
		
		//user.main = this.setupDisplayName(user);
		user.main = user.name.toLowerCase();
		
		icon = 'smurf.png'; iconTitle = 'User';
		if( user.isHost ){ 			icon = 'napoleon.png';	iconTitle = 'Hosting a battle'; 		}
		if( user.owner ){ 			icon = 'robot.png';		iconTitle = 'Bot'; 						}
		if( user.isInBattle ){		icon = 'soldier.png';	iconTitle = 'In a battle room';			}
		if( user.cpu === '6666' ){ 	icon = 'robot.png';		iconTitle = 'Automated Battle Host';	}
		user.icon = icon;
		user.iconTitle = iconTitle
		this.store.notify( user, name )
	},
	/*
	'setupDisplayName':function(user)
	{
		var icon, title;
		icon = 'smurf.png'; title = 'User';
		if( user.isHost ){ 			icon = 'napoleon.png';	title = 'Hosting a battle'; 		}
		if( user.owner ){ 			icon = 'robot.png';		title = 'Bot'; 						}
		if( user.isInBattle ){		icon = 'soldier.png';	title = 'In a battle room';			}
		if( user.cpu === '6666' ){ 	icon = 'robot.png';		title = 'Automated Battle Host';	}
		
		return JSON.stringify( {
			'nameLower': user.name.toLowerCase(),
			'name': user.name,
			'isAdmin' : user.isAdmin,
			'cpu' : user.cpu,
			'bot' : (user.owner ? true : false),
			'icon': icon,
			'iconTitle':title,
			'isInGame':user.isInGame,
			'inGameSince':user.inGameSince,
			'isAway':user.isAway,
			'awaySince':user.awaySince
		} );
	},
	*/
	'refresh':function()
	{
	},
	
	'empty':function()
	{
		var items;
		items = this.store.query({'id': new RegExp('.*') });
		array.forEach(items, function(item){
			this.store.remove(item.id)
		}, this)
		//this.store.setData([])
	},
	
	
	'blank':null
}); });//declare lwidgets.PlayerList
