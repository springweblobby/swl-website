<?php

$params = array(
	'springname' => $_GET['springname'],
	'filename' => $_GET['filename'],
	'tag' => $_GET['tag'],
	'sdp' => $_GET['sdp'],
	'category' => $_GET['category'],
);
if ($_GET['images']) $params['images'] = true;
if ($_GET['metadata']) $params['metadata'] = true;
if ($_GET['nosensitive']) $params['nosensitive'] = true;
$request = xmlrpc_encode_request('springfiles.search', $params);
$context = stream_context_create(array('http' => array(
	'method' => 'POST',
	'header' => 'Content-Type: text/xml',
	'content' => $request
)));
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(xmlrpc_decode(file_get_contents('http://api.springfiles.com/xmlrpc.php',
	false, $context)), JSON_PRETTY_PRINT);

?>
