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
		
		'dijit/_WidgetBase',
		
		//extras
		
		'dojox/grid/DataGrid',
		
		'dojo/data/ItemFileWriteStore',
		'dojox/grid/_FocusManager'
	],
	function(declare, dojo, dijit, template, WidgetBase ){
	
	dojox.grid._FocusManager.prototype._delayedHeaderFocus = function(){
		if(this.isNavHeader()){
			this.focusHeader();
			//this.grid.domNode.focus();
		}
	}	
	
	return declare( [ WidgetBase ], {
		
	//'widgetsInTemplate':true,
	//'templateString' : dojo.cache("lwidgets", "templates/playerlist.html"),
	
	'store':null,
	'startMeUp':true,
	
	'buildRendering':function()
	{
		
		var div1, layout;
		
		//div1 = dojo.create('div', {  'style':{'width':'100%', 'height':'100%', /*this is important!*/'minHeight':'300px' }});
		div1 = dojo.create('div', {  'style':{'width':'100%', 'height':'100%' }});
		
		//dojo.create('span', { 'innerHTML':'special playerlist goes here' }, div1);
		this.domNode = div1;
		
		layout = [
			{	field: 'country',
				name: '<img src="img/globe.png" title="Location" />',
				width: '20px',
				formatter: function(value)
				{
					if(value === '??')
					{
						return '<img src="img/flags/unknown.png" title="Unknown Location" width="16"> ';
					}
					return '<img src="img/flags/'+value.toLowerCase()+'.png" title="'+value+'" width="16"> ';
				}
			},
			{	field: 'main',
				name: 'Users',
				width: (250-20-30) + 'px',
				formatter: function(valueStr)
				{
					var value, lobbyClient;
					value = eval( '(' + valueStr + ')' );
					
					lobbyClient = '';
					if(value.cpu === '7777')
					{
						lobbyClient = ' <img src="img/blobby.png" align="right" title="Using Spring Web Lobby" width="16">'
					}
					else if(value.cpu === '6667')
					{
						lobbyClient = ' <img src="img/zk_logo_square.png" align="right" title="Using Zero-K Lobby" width="16">'
					}
					
					return '<span style="color:black; ">'
						+ '<img src="img/'+value.icon+'" title="'+value.iconTitle+'" width="16"> '
						+ value.name
						+ (value.isAdmin ? ' <img src="img/wrench.png" align="right" title="Administrator" width="16">' : '')
						+ lobbyClient
						+ (value.isInGame ? ' <img src="img/battle.png" align="right" title="In a game since '
						   + value.inGameSince + '" width="16">' : '')
						+ (value.isAway ? ' <img src="img/away.png" align="right" title="Away since '
							+ value.awaySince +'" width="16">' : '')
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
			
			'sortInfo':2, //by alpha
			
			'queryOptions':{'ignoreCase': true},
            'store': this.store,
            //'clientSort': true,
            'rowSelector': '5px',
            'structure': layout,
			'autoHeight':false,
			'autoWidth':false,
			'height':'100%',
			'onRowDblClick':dojo.hitch(this, 'queryPlayer')
		} ).placeAt(div1);
		
		dojo.subscribe('Lobby/battle/playerstatus', this, 'updateUser' );
		
	},
	
	'setupStore':function()
	{
		this.store = new dojo.data.ItemFileWriteStore(
			{
				'data':{
					'identifier':'name',
					'label':'main',
					'items':[]
				}
			}
		);
	},
	
	'startup2':function()
	{
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.grid.startup();
			setTimeout( function(thisObj){
				//thisObj.resizeAlready();
				thisObj.saveStore();
			}, 500, this );
			//this.saveStore();
			
		}
	},
	
	'saveStore':function()
	{
		this.store.save({
			'onComplete':dojo.hitch(this, function(){
				this.grid.sort();
				this.grid.update();
			} )
		});
	},
	
	'resizeAlready':function()
	{
		this.grid.resize();
		this.grid.update();
		//this.saveStore();
	},
	
	'postCreate':function()
	{
		dojo.subscribe('Lobby/connecting', this, 'empty' );
		this.postCreate2();
	},
	
	'postCreate2':function()
	{
	},

	'queryPlayer':function( e )
	{
		var row, name;
		row = this.grid.getItem(e.rowIndex);
		if( typeof row === 'null' )
		{
			//from double clicking on "..."
			return;	
		}
		name = row.name[0];
		dojo.publish('Lobby/chat/addprivchat', [{'name':name, 'msg':'' }]  );
		
		dojo.publish('Lobby/focuschat', [{'name':name, 'isRoom':false }]  );
	},
	
	'addUser':function(user)
	{
		user.main = this.setupDisplayName(user);
		this.store.newItem( user );
		//this.saveStore(); //must be done after add/delete!
		setTimeout( function(thisObj){
			thisObj.saveStore(); //must be done after add/delete!
		}, 200, this );
	},
	'removeUser':function(user)
	{
		this.store.fetchItemByIdentity({
			'identity':user.name,
			'scope':this,
			'onItem':function(item)
			{
				if(item)
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
		
		
		this.store.fetchItemByIdentity({
			'identity':user.name,
			'scope':this,
			'onItem':function(item)
			{
				if( item )
				{
					user.main = this.setupDisplayName(user);
					for(attr in user){
						if(attr !== 'name' )
						{
							this.store.setValue(item, attr, user[attr]);
						}
					}
					this.saveStore(); //must be done after add/delete!
				}
			}
		});
	},
	
	'setupDisplayName':function(user)
	{
		var icon, title;
		icon = 'smurf.png'; title = 'User';
		if( user.isHost ){ 			icon = 'napoleon.png';	title = 'Hosting a battle'; 		}
		if( user.owner ){ 			icon = 'robot.png';		title = 'Bot'; 						}
		if( user.isInBattle ){		icon = 'soldier.png';	title = 'In a battle room';			}
		if( user.cpu === '6666' ){ 	icon = 'robot.png';		title = 'Automated Battle Host';	}
		
		return JSON.stringify( {
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
	
	'refresh':function()
	{
	},
	
	'empty':function()
	{
		//dojo.empty( this.playerListSelect.domNode );
		this.store.fetch({
			'query':{'name':'*'},
			'scope':this,
			'onItem':function(item)
			{
				this.store.deleteItem(item);
				this.saveStore(); //must be done after add/delete!
			}
		});
	},
	
	
	'blank':null
}); });//declare lwidgets.PlayerList
