/** @jsx React.DOM
 *
 * An item in the UserList. It shows as much data as you give it, the only
 * required data field is user.name
 */

'use strict'

var _ = require('lodash');

module.exports = React.createClass({
	render: function(){
		var user = {
			cpu: 0,
		};
		_.extend(user, this.props.user);
		var frontPics = [];
		var backPics = [];

		// Country
		if (user.country)
			frontPics.push(<img src={'img/flags/' + user.country.toLowerCase() + '.png'} key="country" />);

		// Is a bot?
		if ('bot' in user)
			frontPics.push(<img src={user.bot ? 'img/robot.png' : 'img/soldier.png'} key="bot" />);

		// Lobby
		if ( _.indexOf( ['7777', '7778', '7779'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/blobby2icon-small.png" title = "Spring Web Lobby" key="lobby" />);
		else if ( _.indexOf( ['6666', '6667', '6668'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/zk_logo_square.png" title = "Zero-K Lobby" key="lobby" />);
		else if ( _.indexOf( ['9997', '9998', '9999'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/notalobby.png" title = "NotaLobby" key="lobby" />);
		else if ( _.indexOf( ['8484'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/mlclient.ico" title = "mlclient" key="lobby" />);
		else if ( _.indexOf( ['4607052', '4607063', '4607053'], user.cpu ) !== -1 )
			backPics.push(<img src = "img/flobby.png" title = "flobby" key="lobby" />);

		// OS
		if ( _.indexOf([ '7777', '9998', '6667', '4607063' ], user.cpu) !== -1 )
			backPics.push(<img src="img/windows.png" title = "Microsoft Windows" key="os" />);
		else if ( _.indexOf([ '7778', '9999', '6668', '4607052' ], user.cpu) !== -1 )
			backPics.push(<img src="img/linux.png" title = "Linux" key="os" />);
		else if ( _.indexOf([ '7779', '9997', '4607053' ], user.cpu) !== -1 )
			backPics.push(<img src="img/mac.png" title = "MacOS" key="os" />);

		return (<li className="userItem">
			<span className="userFrontPics">{frontPics}</span>
			{user.name}
			<span className="userBackPics">{backPics}</span>
		</li>);
	}
});
