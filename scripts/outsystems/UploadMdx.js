var axios;
var base64;
const path = require("path")
const fs = require('fs');
const { log } = require('../common');
const common = require('../common');

module.exports = function(context) {


	if(isCordovaAbove(context,8)){
        axios = require('axios');
        base64 = require('base-64');
	}else{
        base64 = context.requireCordovaModule('base-64');
        axios = context.requireCordovaModule('axios');
	}

	process.chdir(context.opts.projectRoot);

    var mode = "";
	if (context.cmdLine.indexOf('release') >= 0) {
	    mode = 'release';
	}
	mode = 'debug';

    let pkg = JSON.parse(fs.readFileSync(common.PackageJson).toString());
	if (!pkg.hasOwnProperty('displayName')) {
		log('No display name defined in package.json. Are you sure this is a Cordova project?', 'red');
		return 0;
	}
    let projectName = pkg['displayName'];

    const plugin = JSON.parse(fs.readFileSync(path.join(context.opts.projectRoot,"plugins", 'fetch.json'),"utf8"))[common.PluginId];

    var encryptedAuth = plugin.variables.CREDENTIALS;
    if(encryptedAuth.includes(":")){
        encryptedAuth = "Basic "+base64.encode(encryptedAuth);
    }
    var baseUrl = plugin.variables.WEBSERVICEURL;

    //let form = new FormData();
    var mdxFile;
    if(fs.existsSync("platforms/android")){
        if(mode == "release"){
            baseUrl += "?type=release&platform=android&name="+projectName;
            mdxFile = fs.readFileSync('mdx/android-release.mdx');
        }else{
            baseUrl += "?type=debug&platform=android&name="+projectName;
            mdxFile = fs.readFileSync('mdx/android-debug.mdx');
        }
    }else{
        baseUrl += "?type="+mode+"&platform=ios&name="+projectName;
        var files = []
        var forEnd = true;
        files = fs.readdirSync("platforms/ios/build/device");
        files.forEach((file)=>{
            var curSource = path.join("platforms/ios/build/device",file);
            if(path.extname(file) == ".mdx" && forEnd){
                forEnd=false;
                mdxFile = fs.readFileSync(curSource);
            }
        });
    }
    axios.post(baseUrl,mdxFile,{
        headers:{
            "Authorization": encryptedAuth
        }
    }).then((response)=>{
        log("Successfully sent file!!");
    }).catch((error)=>{
        log("Failed to send file!!");
        log(error);
    });
}

function isCordovaAbove (context, version) {
	var cordovaVersion = context.opts.cordova.version;
	console.log(cordovaVersion);
	var sp = cordovaVersion.split('.');
	return parseInt(sp[0]) >= version;
}