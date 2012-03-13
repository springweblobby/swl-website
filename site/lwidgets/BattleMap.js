///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

///////////////////////////////////



define(
	//'lwidgets.BattleMap',
	[
		"dojo/_base/declare",
		"dojo",
		"dijit",
		
		'dijit/_WidgetBase',
		'lwidgets',
		
		//extras
		
		
	],
	function(declare, dojo, dijit, WidgetBase, lwidgets ){
	//function(declare, dojo, dijit, WidgetBase ){
	return declare([ WidgetBase ], {		

	
	'map':'',
	'mapClean':'',
	'mapTypeIndex':0,
	'mapTypes' : [ 'minimap', 'heightmap', 'metalmap' ],
	'mapImg':null,
	'mapLink':null,
	'boxButton':null,
	
	'mapDiv':null,
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
	
	'interimStartBox':null,
	
	'buildRendering':function()
	{		
		var div1, viewButton;
		
		this.startBoxColors = ['green', 'red', 'blue', 'cyan', 'yellow', 'magenta', 'lime', 'maroon', 'navy', 'olive', 'purple', 'teal' ];
		
		//div1 = dojo.create('div', {  'style':{'width':'49%', 'height':'100%' }});
		//div1 = dojo.create('div', {});
		div1 = dojo.create('div', {'style':{'width':'100%', 'height':'100%' }});
		this.domNode = div1;
		
		this.mapLink = dojo.create('a', {href:'', 'innerHTML':'Map Link', 'target':'_blank' }, div1);
		
		viewButton = new dijit.form.Button( {
            'style': {'height': '22px', 'width': '22px'  },
			'label':'Cycle map views.',
			'showLabel':false,
			'iconClass':'smallIcon mapImage',
			'onClick':dojo.hitch( this, 'cycleMaps' )
        }).placeAt(div1);
		
		this.boxButton = new dijit.form.Button({
			'label':'Add start box mode. Click to enter remove start box mode.',
			'showLabel':false,
			'checked':true,
			//'iconClass':"dijitCheckBoxIcon",
			'style': {'height': '22px', 'width': '52px'  },
			'iconClass':"wideIcon boxesPlusImage",
			//'onClick':dojo.hitch(this, function(val){
			'onClick':dojo.hitch(this, function(){
				this.addBoxes = !this.addBoxes;
				var val = this.addBoxes;
				this.boxButton.set('label', (val ? 'Add' : 'Remove')+' start box mode. Click to enter ' + (val ? 'remove' : 'add') + ' start box mode' );
				this.boxButton.set('iconClass', (val ? 'wideIcon boxesPlusImage' : 'wideIcon boxesMinusImage') );
				dojo.style( this.paintDiv, 'zIndex', (val ? '3' : '-8') );
			} )
		}).placeAt( div1 );
		
		dojo.create('br', {}, div1 );
		dojo.create('br', {}, div1 );
		
		this.mapDiv = dojo.create('div',{
			'style':{
				'width':'100%',
				'position':'relative', //needed for zindex
				'height':'100%',
				'zIndex':0
			},
			'id':'mapDiv' //for firebug
		}, div1);
		
		
		/*
		*/
		
		this.paintDiv = dojo.create('div', {
			'style':{
				//'position':'relative', //needed for zindex
				'position':'absolute', //needed for zindex
				'top':0,
				
				'width':'100%',
				'height':'100%',
				
				'zIndex':3
			},
			'id':'paintDiv', // for firebug
			
			'onmousedown':dojo.hitch(this, 'startDrawMap'),
			'onmousemove':dojo.hitch(this, 'drawInterimStartBox')
			
		}, this.mapDiv);
		
		this.mapImg = dojo.create('img', {
			'src':'',
			'style':{
				'width':'100%',
				'zIndex':-7,
				'position':'relative'
			}
		//}, this.paintDiv );
		}, this.mapDiv );
		
		this.updateMap();
		
		this.startBoxes = {};
		
		dojo.subscribe('Lobby/map/addrect', this, 'addRectangle' );
		dojo.subscribe('Lobby/map/remrect', this, function(data){
			var startBox = this.startBoxes[ data.aID ];
			dojo.destroy( startBox  );
		} );
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
