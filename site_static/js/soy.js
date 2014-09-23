if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function (str){
		return this.slice(-str.length) == str;
	};
}

function removeFromArray(array, item)
{
    while((index = array.indexOf(item)) > -1)
        array.splice(index,1);
}

function ShowElement($ElementName,Visible)
{
	if ( Visible == undefined )
		Visible = true;
	var Element = document.getElementById($ElementName);
	if ( !Element )
		return;
	Element.style.display = Visible ? "block" : "none";
}

function GetElement($Name)
{
	return document.getElementById($Name);
}

function IsDevice(Name)
{
	return ( navigator.userAgent.indexOf(Name) != -1 );
}

function IsWebsocketSupported()
{
	if ( "WebSocket" in window )
		return true;
	
	//ws = new MozWebSocket(url);
	//if ( "MozWebSocket" in window )
	//	return true;
	
	return false;
}

function IsAjaxSupported()
{
	if ( "XMLHttpRequest" in window )
		return true;
	return false;
}

function IsCanvasSupported()
{
	//	check three.js support and canvas support...
	return true;
}

function console_logStack()
{
	var stack = new Error().stack;
	console.log(stack);
}

//	register error handler for devices where we can't see the console
//	if chrome()
if ( IsDevice('iPad') || IsDevice('iPhone') )
{
	window.onerror = function(error,file,line) {
		var Debug = file + "(" + line + "): " + error;
		alert(Debug);
	};
	
}

//	hijack console.log
function BindConsole($ElementName)
{
	var $console = document.getElementById( $ElementName );
	if ( !$console )
		return;

	var oldLog = console.log;
	console.log = function (message)
	{
		$console.innerText += message + "\n";
		oldLog.apply(console, arguments);
	};
}

BindConsole('console');



function ascii (a)
{
	return a.charCodeAt(0);
}



function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}


function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}


function CheckDefaultParam($Param,$Default)
{
	if ( typeof $Param == 'undefined' )
		return $Default;
	return $Param;
}
