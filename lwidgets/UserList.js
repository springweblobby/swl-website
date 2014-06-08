///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	'lwidgets/UserList',
	[
		"dojo/_base/declare",
		
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		
		'dojo/_base/event',
		
		'dijit/_WidgetBase',
		
		"dojo/store/Memory",
		"dojo/store/Observable",
		
		'dgrid/OnDemandGrid',
		'dgrid/Selection',
		'dgrid/extensions/ColumnResizer',
		
		'dijit/layout/ContentPane',
		
		'dijit/Tooltip',
		'dijit/TooltipDialog',
		'dijit/form/DropDownButton',
		
		
		'dojo/request',
		'dojo/request/script'
		
		//extras
		//'dojo/dom', //needed for widget.placeAt to work now
		
	],
	function(declare,
		array, domConstruct, domStyle, domAttr, lang, topic,
		event,
		WidgetBase,
		
		Memory, Observable,
		OnDemandGrid, Selection, ColumnResizer,
		
		ContentPane,
		Tooltip,
		TooltipDialog,
		DropDownButton,
		request,
		script
		){
	
	return declare( [ WidgetBase ], {
		
	store: null,
	startMeUp: true,
	
	name: 'unnamed',
	userCountSpan: null,
	
	gridParent: null,
	
	buildRendering: function()
	{
		
		var div1, layout;
		var ResizeGrid;
		
		var params = {};
		if( !this.style )
		{
			this.style = {width: '100%', height: '100%' };
		}
		params.style = this.style;
		params.class = "playerListSection";
		div1 = domConstruct.create('div', params );
		
		this.domNode = div1;
		
		this.userCountSpan = domConstruct.create('span', {} );
		
		layout = [
			{	field: 'country',
				//label: '<img src="img/globe.png" title="Location" />',
				resizable: true,
				renderHeaderCell: function (node)
				{
					return domConstruct.create('img', {src: 'img/globe.png', title: 'Location', width: 16} );
				},
				renderCell: lang.hitch(this, function (object, value, cell)
				{
					return object.getFlag();
				})
			},
			{	field: 'main',
				label: 'Users',
				renderHeaderCell: lang.hitch(this, function (node) {
					var headerCell = domConstruct.create('span', { innerHTML: 'Users ' } );
					domConstruct.place( this.userCountSpan, headerCell );
					return headerCell;
				} ),
				
				resizable: true,
				
				renderCell: lang.hitch(this, function (object, value, cell)
				{
					var div;
					var os;
					var battleIcon;
					var lobbyClient;
					var curIcon;
					
					div = domConstruct.create( 'div', { style: {padding: '0px' } } );
					
					lobbyClient = object.getLobbyClientIcon();
					
					os = object.getOsIcon();
					battleIcon = object.getBattleIcon()
					
					domConstruct.place( object.getUserIcon( ), div );
					domConstruct.create( 'span', {innerHTML: object.name}, div )
					if( lobbyClient )
					{
						domAttr.set( lobbyClient, 'align', 'right');
						domConstruct.place( lobbyClient, div );
					}
					if( os )
					{
						domAttr.set( os, 'align', 'right')
						domConstruct.place( os, div );
					}
					if( object.isAdmin )
					{
						curIcon = object.getAdminIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					if( object.isAway )
					{
						curIcon = object.getAwayIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					if( battleIcon )
					{
						domStyle.set( battleIcon, 'float', 'right'); //this is a div
						domConstruct.place( battleIcon, div );
					}
					if( object.clan )
					{
						curIcon = object.getClanIcon();
						domAttr.set( curIcon, 'align', 'right')
						domConstruct.place( curIcon, div );
					}
					
					return div;
				})
			},
			/** /
			//this is an extra empty column, sometimes appropriate. without it, all columns get resized fit width
			{	field: '',
				label: '',
			}
			/**/
        ];
		
		domConstruct.create('style', {innerHTML: ''
			//+ ' .dgrid { font-size:small } '
			+ ' .dgrid-cell-padding {  padding:0; } '
			+ '.field-country { width: 30px; text-align:center; vertical-align:middle; } '
			+ '.field-main { width: 180px; } '
			//+ '.field-main { width: ' + (parseInt( this.style.width ) - 30) + 'px; } '
		 }, div1 );
		//domConstruct.create('style', {'innerHTML':' .field-main { width: 150px; } ' }, this.domNode );
		
		this.setupStore();
		ResizeGrid = declare([OnDemandGrid, Selection, ColumnResizer]);
		this.gridParent = domConstruct.create('div', {style: { height: '100%', width: '100%', /*doesnt help*/minHeight: '50px' }}, div1);
		this.grid = new ResizeGrid({
			useTouchScroll: false,
			store: this.store,
            columns: layout,
			selectionMode: 'single'
		//}, domConstruct.create('div', {'style':{ 'height':'100%', 'width':'100%', /*doesnt help*/'minHeight':'50px' }}, div1) ); // no placeAt because not dijit
		}, this.gridParent ); // no placeAt because not dijit
		this.grid.set('sort', 'main');
		this.grid.on(".dgrid-row:dblclick", lang.hitch(this, 'queryPlayer') );
		this.grid.on(".dgrid-row:click", lang.hitch(this, function(e){
			this.grid.clearSelection();
			this.grid.select(e);
		}));
		this.subscribe('Lobby/battle/playerstatus', 'updateUserPlayerStatus' );
		this.subscribe('Lobby/updateUser', 'updateUser' );
		
	},
	
	setupStore: function()
	{
		this.store = Observable( new Memory({data: [], identifier: 'id'}) );
	},
	
	startup2: function()
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
	
	
	resizeAlready: function()
	{
		this.startup2();
		this.grid.resize();
	},
	
	postCreate: function()
	{
		this.subscribe('Lobby/connecting', 'empty' );
		this.postCreate2();
	},
	
	postCreate2: function()
	{
	},
	
	queryPlayer: function( e )
	{
		var row, name;
		row = this.grid.row(e);
		name = row.id;
		topic.publish('Lobby/chat/addprivchat', {name: name, msg: '' }  );
		topic.publish('Lobby/focuschat', {name: name, isRoom: false }  );
	},
	
	count: 0,
	addUser: function(user)
	{
		var icon, iconTitle;
		icon = 'smurf.png'; iconTitle = 'User';
		user.icon = icon;
		user.iconTitle = iconTitle
		user.main = user.name.toLowerCase();
		user.id = user.name;
		this.count += 1;
		this.setCount();
		this.store.put( user );
	},
	
	removeUser: function(user)
	{
		this.count -= 1;
		this.setCount();
		this.store.remove( user.name );
	},
	
	updateUser: function( user )
	{
		var name;
		name = user.name;
		
		if( user.local )
		{
			return;
		}
		if( typeof this.store.get(name) === 'undefined' )  //calling store.notify will add a user if it doesn't exist
		{
			return;
		}
		
		user.main = user.name.toLowerCase();
		this.store.notify( user, name )
	},
	
	updateUserPlayerStatus: function( data )
	{
		var name, user;
		
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
		this.store.notify( user, name )
	},
	
	selectUser: function(name)
	{
		this.grid.clearSelection();
		this.grid.select( name );
		//this.grid.select( this.grid.row(name) ); //also works. leave here
		
		if( this.grid.row(name) ) //user has logged off
		{
			this.grid.row(name).element.scrollIntoView();
		}
	},
	
	refresh: function()
	{
	},
	
	empty: function()
	{
		var items;
		items = this.store.query({id: new RegExp('.*') });
		array.forEach(items, function(item){
			this.store.remove(item.id)
		}, this);
		this.count = 0;
		this.setCount();
		//this.store.setData([])
	},
	
	setCount: function()
	{
		domAttr.set( this.userCountSpan, 'innerHTML', '(' + this.count + ')' );
	},
	
	
	blank: null
}); });//declare lwidgets.PlayerList
