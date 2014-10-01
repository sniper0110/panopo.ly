var RENDERMODE_WEBGL = 'webgl';		//	three js
var RENDERMODE_CANVAS = 'canvas';	//	three js without webgl
var RENDERMODE_CUBEMAP = 'cubemap';	//	css3d
var RENDERMODE_NONE = null;

function SoyConfig($RenderMode)
{
	//	higher fov = higher seperation
	
	//	webgl
	//	100 = 0.08 (0.09 tolerable on both)
	//	90 = 0.05

	//	cubemap
	//	100 = 0.10
	//	90 = 0.08
	//	70 = 0.07
	this.mFov = 90;
	this.mSeperation = 0.06;

	//	gr: fov ~100 has clipping issues in css mode
	
	//	larger res = clipping issues
	//	gr: trying low res for mobile to stop crashes
	if ( IsMobile() )
	{
		this.mFaceResolution = 256;
		this.mMaxResolution = 2048;
	}
	else
	{
		//	osx chrome css clips badly at 2000px
		//	performance improves as resolution lowers...
		//		this.mFaceResolution = 1500;
		//		this.mMaxResolution = 4096;
		//	ideal: face resolution matches actual face res... otherwise we're wasting video pixels
		this.mFaceResolution = 512;
		this.mMaxResolution = 4096;
	}

	this.mRenderMode = $RenderMode;
	
	assert(	this.mRenderMode == RENDERMODE_WEBGL ||
		   this.mRenderMode == RENDERMODE_CANVAS ||
		   this.mRenderMode == RENDERMODE_NONE ||
		   this.mRenderMode == RENDERMODE_CUBEMAP
		   );
}
