var HAVE_NOTHING = 0;//	- no information whether or not the audio/video is ready
var HAVE_METADATA = 1;	//	- metadata for the audio/video is ready
var HAVE_CURRENT_DATA = 2;	//- data for the current playback position is available, but not enough data to play next frame/millisecond
var HAVE_FUTURE_DATA = 3;	//- data for the current and at least the next frame is available
var HAVE_ENOUGH_DATA = 4;

function GetHost()
{
	return 'http://image.panopo.ly/';
}


function SoyAsset($Pano,$Meta,$OnLoaded,$OnFailed)
{
	if ( arguments.length <= 1 )
	{
		this.mType = arguments[0];
		return;
	}

	var $Host = GetHost();
	
	this.mPano = $Pano;
	this.mAsset = null;			//	set once loaded
	this.mUrl = $Host + $Meta.Filename;
	this.mOnLoaded = $OnLoaded;
	this.mOnFailed = $OnFailed;
	this.mDesired = true;		//	when we don't want the asset we mark it
	this.mMeta = $Meta;
}

SoyAsset.prototype.GetType = function()
{
	return this.mType;
}

SoyAsset.prototype.OnError = function()
{
	//	not a failure if we cancelled
	if ( !this.mDesired )
		return;
	this.mOnFailed( this );
}

SoyAsset.prototype.IsLoaded = function()
{
	return (this.mAsset != null);
}




SoyAsset_Ajax.prototype = new SoyAsset('Ajax');

function SoyAsset_Ajax($Pano,$FileName,$OnLoaded,$OnFailed)
{
	var $Meta = new SoyAssetMeta();
	$Meta.Filename = $FileName;
	
	//	call super
	SoyAsset.apply( this, [$Pano,$Meta,$OnLoaded,$OnFailed] );

	this.mAjax = null;

	this.Load();
}


SoyAsset_Ajax.prototype.Stop = function()
{
	this.mDesired = false;
	if ( this.mAjax )
	{
		this.mAjax.abort();
		this.mAjax = null;
	}
	assert( !this.IsLoaded(), "Loaded state wrong" );
}

SoyAsset_Ajax.prototype.Load = function()
{
	var $this = this;
	
	//	fetch
	console.log("Loading " + this.mUrl );
	
	var ajax = new XMLHttpRequest();
	this.mAjax = ajax;
	ajax.addEventListener("load", function($Event){ $this.OnLoad($Event); }, false);
	ajax.addEventListener("error", function($Event){ $this.OnError($Event); }, false);
	ajax.addEventListener("abort", function($Event){ $this.OnError($Event); }, false);
	ajax.open("GET", this.mUrl, true );
	//ajax.setRequestHeader('Content-Type', 'multipart/form-data;');
	ajax.withCredentials = false;
	ajax.send( null );
}

SoyAsset_Ajax.prototype.OnLoad = function($Event)
{
	try
	{
		this.mAsset = JSON.parse( $Event.target.responseText );
	}
	catch ( e )
	{
		console.log("bad json" + $Event.target.responseText);
		//	fail on bad json
		this.OnError($Event);
		return;
	}
	//this.mAssetType = $Event.target.responseType;
	assert( this.IsLoaded(), "Loaded state wrong" );
	this.mOnLoaded( this );
}












SoyAsset_Image.prototype = new SoyAsset('Image');

function SoyAsset_Image($Pano,$Meta,$OnLoaded,$OnFailed)
{
	//	call super
	SoyAsset.apply( this, [$Pano,$Meta,$OnLoaded,$OnFailed] );
	
	this.Load();
}

SoyAsset_Image.prototype.Stop = function()
{
	this.mDesired = false;
	
	//	stop loading of img
	delete this.mAsset;

	assert( !this.IsLoaded(), "Loaded state wrong" );
}

SoyAsset_Image.prototype.Load = function()
{
	var $this = this;
	
	//	fetch
	console.log("Loading " + this.mUrl );
	
	var $Image = document.createElement('img');
	this.mImage = $Image;
	$Image.addEventListener('load', function($Event){ $this.OnLoad($Event); }, false );
//	$Image.addEventListener('progress', function($Event){ $this.OnLoad($Event); }, false );
	$Image.addEventListener('error', function($Event){ $this.OnError($Event); }, false );
			
	$Image.crossOrigin = '';
	$Image.src = this.mUrl;
}

SoyAsset_Image.prototype.OnLoad = function($Event)
{
	//	move ownership
	this.mAsset = this.mImage;
	this.mImage = null;
	
	assert( this.IsLoaded(), "Loaded state wrong" );
	this.mOnLoaded( this );
}

SoyAsset_Image.prototype.OnError = function($Event)
{
	assert( !this.IsLoaded(), "Loaded state wrong" );
	//	not a failure if we cancelled
	if ( !this.mDesired )
		return;
	this.mOnFailed( this );
}










//	same as asset data in .meta so can construct from json
function SoyAssetMeta($Filename,$Width,$Height,$Format,$Codec,$BitRate)
{
	if ( arguments.length == 0 )
		return;
	
	//	if only one arg, we've supplied JSON
	if ( arguments.length <= 1 )
	{
		var $Json = arguments[0];
		this.Width = $Json.Width;
		this.Height = $Json.Height;
		this.Format = $Json.Format;
		this.Codec = $Json.Codec;
		this.BitRate = $Json.BitRate;
		this.Filename = $Json.Filename;
		return;
	}
	
	this.Width = $Width;
	this.Height = $Height;
	this.Format = $Format;
	this.Codec = $Codec;
	this.BitRate = $BitRate;
	this.Filename = $Filename;
}

SoyAssetMeta.prototype.IsBetter = function($that)
{
	//	video always better than image
	if ( this.IsVideo() != $that.IsVideo() )
		return this.IsVideo();
	
	//	compare width
	if ( this.Width > $that.Width )
		return true;
	if ( this.Width < $that.Width )
		return false;
	
	//	compare height
	if ( this.Height > $that.Height )
		return true;
	if ( this.Height < $that.Height )
		return false;
	
	if ( this.IsVideo() )
	{
		if ( this.BitRate > $that.BitRate )
			return true;
		if ( this.BitRate < $that.BitRate )
			return false;
	}
	
	//	not better, same
	return false;
}

SoyAssetMeta.prototype.IsCubemap = function()
{
	if ( typeof this.Codec == 'undefined' )
		return false;
	if ( !this.Codec.startsWith('cubemap') )
		return false;
	return true;
}

SoyAssetMeta.prototype.IsVideo = function()
{
	if ( typeof this.BitRate == 'undefined' )
		return false;
	return true;
}

SoyAssetMeta.prototype.IsSupported = function()
{
	//	test
	if ( this.Width > 4000 || this.Height > 4000 )
		return false;
	
	if ( this.IsVideo() )
	{
		//	do video codec test
		var $Video = document.createElement('video');
		var $Type = this.mMeta.Format;
		var $Codec = this.mMeta.Codec;
		var $VideoTypeString = 'video/' + $Type + ';codecs="' + $Codec + '"';
		var $CanPlay = $Video.canPlayType($VideoTypeString);
		if ( $CanPlay == "" )
			return false;
	}
	
	return true;
}






SoyAsset_Video.prototype = new SoyAsset('Video');

function SoyAsset_Video($Pano,$Meta,$OnLoaded,$OnFailed)
{
	//	call super
	SoyAsset.apply( this, [$Pano,$Meta,$OnLoaded,$OnFailed] );

	this.Load();
}

SoyAsset_Video.prototype.Stop = function()
{
	this.mDesired = false;

	if ( this.mAsset )
	{
		//	abort video by setting invalid src
		this.mAsset.src = '';
		this.mAsset.load();
	//	this.mAsset.stop();
		delete this.mAsset;
		this.mAsset = null;
	}
	assert( !this.IsLoaded(), "Loaded state wrong" );
}

SoyAsset_Video.prototype.Load = function()
{
	var $this = this;
	
	//	fetch
	console.log("Loading " + this.mUrl );
	
	var $Video = document.createElement('video');
	this.mVideo = $Video;

	var $Type = this.mMeta.Format;
	var $Codec = this.mMeta.Codec;
	var $VideoTypeString = 'video/' + $Type + ';codecs="' + $Codec + '"';
	var $CanPlay = $Video.canPlayType($VideoTypeString);
	if ( $CanPlay == "" )
	{
		console.log("Browser cannot play " + $VideoTypeString );
		this.OnError();
		return;
	}
	
	//	video.width = 640;
	//	video.height = 360;
	//	video.type = ' video/ogg; codecs="theora, vorbis" ';
	$Video.autoplay = true;
	$Video.loop = true;
	$Video.crossOrigin = '';
	$Video.src = this.mUrl;

	var $ErrorFunc = function($Event) { $this.OnError($Event); };
	var $StartFunc = function($Event) { $this.OnLoad($Event); };
/*	this.mVideo.addEventListener('loadstart', $ErrorFunc, false );
	this.mVideo.addEventListener('progress', $ErrorFunc, false );
	this.mVideo.addEventListener('canplaythrough', $ErrorFunc, false );
	this.mVideo.addEventListener('loadeddata', $ErrorFunc, false );
	this.mVideo.addEventListener('loadedmetadata', $ErrorFunc, false );
	this.mVideo.addEventListener('timeupdate', $ErrorFunc, false );
	this.mVideo.addEventListener('playing', $ErrorFunc, false );
	this.mVideo.addEventListener('waiting', $ErrorFunc, false );
*/
	$Video.addEventListener('error', $ErrorFunc, false );
	$Video.addEventListener('loadedmetadata', $StartFunc, false );
	$Video.addEventListener('loadstart', $StartFunc, false );
	//$Video.addEventListener('progress', $StartFunc, false );
	//$Video.addEventListener('playing', $StartFunc, false );

	$Video.load(); // must call after setting/changing source
	$Video.play();

}

SoyAsset_Video.prototype.OnLoad = function($Event)
{
	//	gr: swap ownership?
	this.mAsset = this.mVideo;
	assert( this.IsLoaded(), "Loaded state wrong" );
	this.mOnLoaded( this );
}

SoyAsset_Video.prototype.OnError = function($Event)
{
	assert( !this.IsLoaded(), "Loaded state wrong" );
	//	not a failure if we cancelled
	if ( !this.mDesired )
		return;
	this.mOnFailed( this );
}


