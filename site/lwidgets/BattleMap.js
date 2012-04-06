///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////



define(
	//'lwidgets.BattleMap',
	[
		"dojo/_base/declare",
		"dojo",
		"dijit",
		'dojo/text!./templates/battlemap.html?' + cacheString,
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		
		
		'lwidgets',
		'lwidgets/ToggleIconButton',
		
		//extras
		'dijit/ProgressBar',
		
	],
	function(declare, dojo, dijit, template, WidgetBase, Templated, WidgetsInTemplate, lwidgets, ToggleIconButton ){
	//function(declare, dojo, dijit, WidgetBase ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {		

	'templateString' : template,
	
	'map':'',
	'mapClean':'',
	'mapTypeIndex':0,
	'mapTypes' : [ 'minimap', 'heightmap', 'metalmap' ],
	
	'startBoxes':null,
	'startBoxColors':null,
	'curStartBoxColor':0,
	
	'newBox_x1':false,
	'newBox_y1':false,
	
	'newBox_x2':false,
	'newBox_y2':false,
	
	'paintDiv':null,
	'drawing':false,
	
	'addBoxes':true,
	
	'gotMap':false,
	
	'interimStartBox':null,
	'processName':'',
	
	
	'postCreate':function()
	{
		var boxButton;
		this.startBoxColors = ['green', 'red', 'blue', 'cyan', 'yellow', 'magenta', 'lime', 'maroon', 'navy', 'olive', 'purple', 'teal' ];
		this.updateMap();
		
		this.startBoxes = {};
		
		dojo.subscribe('Lobby/map/addrect', this, 'addRectangle' );
		dojo.subscribe('Lobby/map/remrect', this, function(data){
			var startBox = this.startBoxes[ data.aID ];
			dojo.destroy( startBox  );
		} );
		dojo.subscribe('Lobby/download/processProgress', this, 'updateBar' );
		
		boxButton = new ToggleIconButton({
			'style':{'height':'22px', 'width':'52px' },
			'checkedIconClass':'wideIcon boxesPlusImage',
			'uncheckedIconClass':'wideIcon boxesMinusImage',
			'checked':true,
			'checkedLabel':'Add start box mode. Click to enter remove start box mode.',
			'uncheckedLabel':'Remove start box mode. Click to enter add start box mode.',
			'onClick':dojo.hitch(this, 'boxButtonToggle' )
		}).placeAt(this.boxButtonSpan)
	},
	
	'focusDownloads':function(e)
	{
		dojo.stopEvent(e);
		dojo.publish('Lobby/focusDownloads', [] );
	},
	
	'updateBar':function(data)
	{
		if( data.processName !== this.processName )
		{
			return;
		}
		this.mapDownloadBar.update( {'progress':data.perc} );
	},
	'showBar':function( processName )
	{
		this.processName = processName;
		dojo.style( this.mapDownloadBar.domNode, 'display', 'block');
	},
	'hideBar':function()
	{
		this.processName = '';
		dojo.style( this.mapDownloadBar.domNode, 'display', 'none');
	},
		
	'boxButtonToggle':function(val)
	{
		this.addBoxes = val;
		dojo.style( this.paintDiv, 'zIndex', (val ? '3' : '-8') );
	},
	
	
	'setGotMap':function(gotMap)
	{
		dojo.attr( this.mapWarning, 'src', gotMap ? '' : 'img/warning.png');
	},
	
	'startDrawMap':function(e)
	{
		var x1,y1,x2,y2, w,h, addboxMessage, mouseCoord;
		
		if( !this.addBoxes )
		{
			return;
		}
		
		if(this.drawing)
		{
			this.drawing = false;
			
			pwidth = parseInt( dojo.getComputedStyle(this.mapImg).width );
			pheight = parseInt( dojo.getComputedStyle(this.mapImg).height );
			
			x1 = parseInt( dojo.style(this.interimStartBox, 'left' ) )
			y1 = parseInt( dojo.style(this.interimStartBox, 'top' ) )
			x2 = pwidth - parseInt( dojo.style(this.interimStartBox, 'right') )
			y2 = pheight - parseInt( dojo.style(this.interimStartBox, 'bottom') )
			w = parseInt( dojo.style(this.interimStartBox, 'width' ) )
			h = parseInt( dojo.style(this.interimStartBox, 'height' ) )
			
			
			
			//use for direct hosting
			/*
			x1 = Math.round( (x1/pwidth)*200); //note, rename vars
			y1 = Math.round( (y1/pheight)*200); //note, rename vars
			x2 = Math.round( (x2/pwidth)*200);
			y2 = Math.round( (y2/pheight)*200);
			*/
			
			//use for springie
			x1 = Math.round( (x1/pwidth)*100);
			y1 = Math.round( (y1/pheight)*100);
			w = Math.round( (w/pwidth)*100); 
			h = Math.round( (h/pheight)*100); 
			
			
			
			addboxMessage = "!addbox " + x1 +" "+ y1 +" "+ w +" "+ h;
			dojo.publish( 'Lobby/rawmsg', [{'msg':'SAYBATTLE '+ addboxMessage}] );
			
			dojo.destroy( this.interimStartBox );
			
			return;
		}
		this.drawing = true;
		
		// http://stackoverflow.com/questions/5085689/tracking-mouse-position-in-canvas
		/*
		this.newBox_x1 = e.layerX;
		this.newBox_y1 = e.layerY;
		*/
		mouseCoord = getMouseCoord(this.paintDiv, e)
		this.newBox_x1 = mouseCoord.x;
		this.newBox_y1 = mouseCoord.y;
		
		
		this.interimStartBox = dojo.create('div',
			{
				'style':{
					'background':'gray',
					'border':'1px dotted black',
					
					'left':this.newBox_x1 +'px',
					'top':this.newBox_y1 +'px',
					'minWidth':10,
					'minHeight':10,
					
					'width':10,
					'height':10,
					'opacity':0.8,
					'position':'absolute',
					//'position':'relative',
					'zIndex':2
				}
			},
			this.mapDiv
			//this.paintDiv
		);
	},
	'drawInterimStartBox':function(e)
	{
		var right, bottom;
		if( this.drawing )
		{
			mouseCoord = getMouseCoord(this.paintDiv, e)
			this.newBox_x2 = mouseCoord.x;
			this.newBox_y2 = mouseCoord.y;
			
			var parentWidth, parentHeight;
			parentWidth = dojo.style(this.mapDiv, 'width');
			parentHeight = dojo.style(this.mapDiv, 'height');
			
			right = Math.min( parentWidth-this.newBox_x2, parentWidth-(this.newBox_x1+10) )
			bottom = Math.min( parentHeight-this.newBox_y2, parentHeight-(this.newBox_y1+10) )
			
			dojo.style( this.interimStartBox, 'right', right+'px' )
			dojo.style( this.interimStartBox, 'bottom', bottom+'px' )
		}
	},
	
	'addRectangle':function(data)
	{
		var x1,y1,x2,y2,aID, color;
		var x1p,y1p,x2p,y2p;
		var startBoxDiv, allyDiv;
		var range;
		
		range = 200;
		
		x1 = data.x1;
		y1 = data.y1;
		x2 = data.x2;
		y2 = data.y2;
		aID = parseInt(data.aID);
		
		color = this.startBoxColors[ this.curStartBoxColor ];
		this.curStartBoxColor += 1;
		this.curStartBoxColor %= this.startBoxColors.length;
		
		x1p = Math.round( x1 / range * 100 );
		y1p = Math.round( y1 / range * 100 ); 
		x2p = 100-Math.round( x2 / range * 100 );
		y2p = 100-Math.round( y2 / range * 100 );
		
		startBoxDiv = dojo.create('div',
			{
				'style':{
					'background':color,
					
					'left':x1p + "%",
					'top':y1p + "%",
					
					'right':x2p + "%",
					'bottom':y2p + "%",
					'opacity':0.5,
					'position':'absolute',
					'zIndex':1
				},
				'onmousedown':dojo.hitch(this, function(){
					var clearBoxMessage = "!clearbox " + (aID+1);
					if( this.addBoxes )
					{
						return;
					}
					dojo.publish( 'Lobby/rawmsg', [{'msg':'SAYBATTLE '+ clearBoxMessage}] );
				})
			},
			this.mapDiv
			//this.paintDiv
		);
		allyDiv = dojo.create('div',
			{
				'innerHTML':(aID+1),
				'style':{
					//'width':'auto',
					'width':'100%',
					'left':'1px',
					'position':'absolute',
					'verticalAlign':'middle',
					'textAlign':'center',
					//'background':'black',
					'color':'white',
					'fontWeight':'bold',
					'top':'1px',
					'textShadow':'2px 2px black'
				}
			},
			startBoxDiv
		);
		this.startBoxes[aID] = startBoxDiv;
	},
	
	'setMap':function(map)
	{
		this.map = map;
		//this.mapClean = this.map.replace(/ /g, '%20');
		this.mapClean = this.map.replace(/ /g, '_');
		this.updateMap();
	},
	'clearMap':function()
	{
		var aID;
		this.map = null;
		dojo.attr( this.mapImg, 'src', '' );
		dojo.attr( this.mapImg, 'title', '' );
		dojo.attr( this.mapLink, 'href', '' );
		dojo.attr( this.mapLink, 'innerHTML', '' );
		
		//dojo.forEach(this.startBoxes, function(startBox){ });
		for(aID in this.startBoxes){
			var startBox = this.startBoxes[aID];
			dojo.destroy(startBox);
		}
	},
	
	'cycleMaps':function()
	{
		this.mapTypeIndex += 1;
		this.mapTypeIndex %= 3;
		
		this.updateMap();
	},
	
	'getMapLink':function()
	{
		return 'http://zero-k.info/Maps/DetailName?name='+ this.mapClean;
	},
	
	'updateMap':function()
	{
		if(this.mapClean === '')
		{
			return;
		}
		dojo.attr( this.mapImg, 'src', 'http://zero-k.info/Resources/' + this.mapClean + '.' + this.mapTypes[this.mapTypeIndex] + '.jpg' );
		dojo.attr( this.mapImg, 'title', this.map );
		dojo.attr( this.mapLink, 'href', this.getMapLink() );
		dojo.attr( this.mapLink, 'innerHTML', this.map );
		
		this.updateMapDiv();
	},
	
	'updateMapDiv':function()
	{
		dojo.style(this.mapDiv, 'height', dojo.getComputedStyle(this.mapImg).height );
		//dojo.style(this.mapDiv, 'width', dojo.getComputedStyle(this.mapImg).width );
	},
	
	'blank':null
}); }); //declare lwidgets.BattleMap
