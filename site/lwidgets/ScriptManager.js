///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/ScriptManager',
	[
		"dojo/_base/declare",
		
		//"dojo",
		//"dijit",
	],
	function(declare
	//dojo, dijit
	){
	return declare("ScriptManager", [], {
	'script':'',
	'scriptTree':null,
	'constructor':function(args)
	{
		declare.safeMixin(this, args);
		this.scriptTree = {};
	},
	'addScriptPath':function(tree, keyPathArr, val)
	{
		var keyPath, tree2;
		tree2 = tree;
		keyPath = keyPathArr[0];
		if( keyPathArr.length > 1 )
		{
			if( !tree2[keyPath] )
			{
				tree2[keyPath] = {};
			}
			tree2[keyPath] = this.addScriptPath( tree2[keyPath], keyPathArr.slice(1), val );
		}
		else
		{
			tree2[keyPath] = val;
		}
		return tree2;
	},
	
	'removeScriptPath':function(tree, keyPathArr)
	{
		var keyPath, tree2;
		tree2 = tree;
		keyPath = keyPathArr[0];
		if( keyPathArr.length > 1 )
		{
			tree2[keyPath] = this.removeScriptPath( tree2[keyPath], keyPathArr.slice(1) );
		}
		else
		{
			delete tree2[keyPath];
		}
		return tree2;
	},
	
	'addScriptTag':function(keyPath, val)
	{
		var keyPathArr;
		keyPathArr = keyPath.split('/');
		this.scriptTree = this.addScriptPath( this.scriptTree, keyPathArr, val )
	},
	
	'removeScriptTag':function(keyPath)
	{
		var keyPathArr;
		keyPathArr = keyPath.split('/');
		this.scriptTree = this.removeScriptPath( this.scriptTree, keyPathArr )
	},
	
	'clear':function()
	{
		this.scriptTree = {};
	},
	
	'scriptify':function(tree, level)
	{
		var script, v, tabs;
		script = '';
		tabs = Array(level+1).join('\t');
		for( k in tree )
		{
			v = tree[k];
			if( typeof(v) === 'object' )
			{
				script += tabs + '[' + k + ']\n';
				script += tabs + '{\n';
				script += this.scriptify(v, level+1) + '\n'
				script += tabs + '}\n';
			}
			else
			{
				script += tabs + k + '=' + v + ';\n';	
			}
		}
		return script;
	},
	
	'getScript':function()
	{
		return this.scriptify(this.scriptTree, 0)
	},
	
	tempcount: 0,
	descriptify:function( scriptString, path, i )
	{
	
		var c;
		var curPath = path;
		var curVal = '';
		var readKey = false;
		var readVal = false;
		
		this.tempcount++;
		if( this.tempcount > 100 )
		{
			return -1;
		}
		if( i === null )
		{
			i = 0;
		}
		
		for( ; i<scriptString.length; i++ )
		{
			if( i > 99999 )
			{
				return -1;
			}
			
			c = scriptString.substr(i,1);
			
			readKey = true;
			
			if( c === '{' )
			{
				i = this.descriptify( scriptString, curPath + '/', i+1 );
				if( i === -1 )
				{
					return -1;
				}
				curPath = path;
			}
			else if( c === '}' )
			{
				echo('path:',path)
				if( path === 'game/' )
				{
					echo('exiting')
					return -1;
				}
				
				return i;
				
			}
			else if( c === '=' )
			{
				readVal = true;
			}
			else if( c === ';' )
			{
				this.addScriptTag(curPath, curVal)
				echo( 'addScriptTag', curPath, ' == ', curVal)
				readVal = false;
				curPath = path;
				curVal = '';
			}
			else
			{ 
				if( readVal  )
				{
					curVal += c;
				}
				else if( readKey )
				{
					if( c.match(/[^\n \[\]]/) )
						curPath += c;
				}
				
			}
			
		} //for
		
		return -1;
		
	}, //descriptify
	
	'blank':null

}); });//declare scriptmanager

