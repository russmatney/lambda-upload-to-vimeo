var Q = require('q');
var path = require('path');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');
var mime = require('mime');
var fs = require('fs');

var req = require('request');

var vimeoCreds = {
  accessToken: "499a1737e1e8401bcdd321941afad729"
}

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats["size"];
  return fileSizeInBytes;
}

exports.handler = function(event, context) {
  event.localFilepath = "";

  validate(event, {
    sourceBucket: true,
    sourceKey: true,
    musicCredit: true,
    videoTitle: true,
  })

  //download specified file
  .then(function(event) {
    event.localFilepath = "/tmp/" + path.basename(event.sourceKey);
    return download(event, {
      srcBucket: event.sourceBucket,
      srcKey: event.sourceKey,
      downloadFilepath: event.localFilepath
    })
  })

  .then(function(event) {
    var def = Q.defer();
    console.log('waiting for a sec');
    setTimeout(function() {
      def.resolve(event);
    }, 1000);
    return def.promise;
  })

  //get vimeo upload 'ticket'
  .then(function(event) {
    var def = Q.defer();
    req({
      url: "https://api.vimeo.com/me/videos",
      method: "POST",
      json: true,
      body: {
        type: 'streaming'
      },
      headers: {
        'Authorization': 'bearer ' + vimeoCreds.accessToken
      }
    }, function(err, response, body){
      if (err) {
        def.reject(err)
      } else {
        console.log('vimeo upload ticket recieved');
        console.log(body);
        event.upload_link_secure = body.upload_link_secure;
        event.complete_uri = body.complete_uri;
        def.resolve(event);
      }
    })

    return def.promise;
  })

  //upload file to upload_link_secure
  .then(function(event) {
    var def = Q.defer();
    var readStream = fs.createReadStream(event.localFilepath)
    readStream.on('error', function(err) {
      console.log('error uploading file');
      def.reject(err);
    });
    readStream.pipe(
      req({
        url: event.upload_link_secure,
        method: "PUT",
        headers: {
          'Content-Type': mime.lookup(event.localFilepath),
          'Content-Length': getFilesizeInBytes(event.localFilepath)
        }
      }, function(err, response) {
        if (err) {
          def.reject(err)
        } else {
          def.resolve(event);
        }
      }));
    return def.promise;
  })

  //confirm upload success
  .then(function(event) {
    var def = Q.defer();
    req({
      url: event.upload_link_secure,
      method: "PUT",
      headers: {
        'Content-Length': 0,
        'Content-Range': 'bytes */*'
      }
    }, function(err, response) {
      if (err) {
        def.reject(err)
      } else if (response.statusCode !== 308) {
        def.reject(new Error("incomplete download"))
        //TODO: continue upload at byte where it left off
      } else {
        console.log('upload complete');
        def.resolve(event)
      }
    })
    return def.promise;
  })

  //'complete' the vimeo upload - DELETE to the 'complete_uri'
  .then(function(event) {
    var def = Q.defer();
    req({
      url: "https://api.vimeo.com" + event.complete_uri,
      method: "DELETE",
      headers: {
        'Authorization': 'bearer ' + vimeoCreds.accessToken
      }
    }, function(err, response) {
      if (err) {
        def.reject(err)
      } else {
        event.clip_uri = response.headers.location;
        def.resolve(event)
      }
    })
    return def.promise;
  })

  //update video meta data
  .then(function(event) {
    var def = Q.defer();
    req({
      url: "https://api.vimeo.com" + event.clip_uri,
      method: "PATCH",
      json: true,
      body: {//TODO: body here could be handed in as an object to stay more flexible
        name: event.videoTitle,
        description: event.musicCredit //license?
      },
      headers: {
        Authorization: 'bearer ' + vimeoCreds.accessToken
      }
    }, function(err, response, body) {
      if(err) {
        def.reject(err);
      } else {
        console.log('meta data updated');
        console.log(response.statusCode);
        def.resolve(event);
      }
    })
    return def.promise;
  })

  .then(function(event) {
    console.log(event);
    context.done();
  })

  .fail(function(error) {
    console.log('error');
    console.log(error);
    context.done(null, error);
  })

}
