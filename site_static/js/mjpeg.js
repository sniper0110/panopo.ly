
var $LastJpegStart = -1;
var $LastReadPos = -1;
var $Jpegs = new Array();
var $JpegHeader = null;
var $MJpegAjax = null;


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


function PopJpeg($Element)
{
	//	time for another frame
	if ( $Jpegs.length == 0 )
		return false;
	
	//	encode to datauri for html
	$JpegData = $Jpegs[0];
	$Jpegs.splice(0,1);
	
	var $Blob = $JpegData;
	console.log("$Blob:");
	console.log($Blob);
	var $DataUrl = URL.createObjectURL( $Blob );
	console.log("new jpeg" + $DataUrl );
	$Element.src = $DataUrl;
	
	return true;
}

function UpdateJpegToElement($Element,$FrameRate)
{
	PopJpeg( $Element );
	
	var $UpdateRateMs = 1000/parseFloat($FrameRate);
	console.log($UpdateRateMs);
	setTimeout( function(){ UpdateJpegToElement($Element,$FrameRate); }, $UpdateRateMs );
}

function OnJpeg($JpegData)
{
	console.log("Found jpeg");
	var $JpegDataView = new DataView($JpegData);
	var $Blob = new Blob([$JpegDataView], {type: "image/jpeg"});
	$Jpegs.push( $Blob );
}

function OnMJpegData($Event)
{
	var $Data = $Event.target.response;
	if ( $Data == null )
		return;
	console.log($Event);
	console.log($Data);
	var $DataLength = $Data.byteLength;
	
	console.log( typeof $Data );
	
	//	first case
	if ( $LastReadPos < 0 )
	{
		//	calc header
		if ( $DataLength < 5 )
			return;
		$Header = $Data.slice(0,10);
		console.log("jpeg header is ");
		console.log(ab2str($Header) );
		console.log( $Header.byteLength );
		$LastReadPos = $Header.byteLength;
		$LastJpegStart = 0;
	}
	
	//	look for next header
	var $DataView = new DataView($Data);
	var $HeaderView = new DataView($Header);
	
	for ( var $i=$LastReadPos;	$i<$DataLength;	$i++ )
	{
		var $Match = true;
		for ( var $h=0;	$Match && $h<$Header.byteLength;	$h++ )
		{
			var $dd = $DataView.getInt8($i+$h);
			var $hd = $HeaderView.getInt8($h);
			$Match = $Match && ($dd == $hd);
			//	console.log( $dd + "(" + ($i+$h) + ")==" + $hd + " (" + $Match + ")" );
		}
		if ( !$Match )
		{
			$LastReadPos = $i;
			continue;
		}
		
		console.log("found jpeg from " + $LastJpegStart + " to " + $i );
		
		//	found next jpeg
		var $JpegData = $Data.slice($LastJpegStart,$i);
		OnJpeg( $JpegData );
		
		$LastJpegStart = $i;
		$LastReadPos = $LastJpegStart;
		//return;
	}
	
}

function LoadMJpeg($Url,$Element,$FrameRate)
{
	if ( !$Element )
		return;
	
	var $this = this;
	var ajax = new XMLHttpRequest();
	$MJpegAjax = ajax;
	ajax.addEventListener("progress", OnMJpegData, false );
	//	ajax.addEventListener("load", function($Event){ $this.OnReply($Event); }, false);
	//	ajax.addEventListener("error", function($Event){ $this.OnError($Event); }, false);
	//	ajax.addEventListener("abort", function($Event){ $this.OnError($Event); }, false);
	ajax.open("GET", $Url, true );
	//ajax.setRequestHeader('Content-Type', 'multipart/form-data;');
	ajax.withCredentials = false;
	ajax.responseType = 'arraybuffer';
	ajax.send( null );
	
	//	gr: on first success start the auto-update
	UpdateJpegToElement( $Element, $FrameRate );
}


