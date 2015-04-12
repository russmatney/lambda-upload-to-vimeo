var Q = require('q');
var path = require('path');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');
var mime = require('mime');
var fs = require('fs');

var req = require('request');

var vimeoCreds = {
  accessToken: "55a8d1476ec34778e207a4fb59cb4d5a"
}

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats["size"];
  return fileSizeInBytes;
}

exports.handler = function(event, context) {
  var localFilepath = "";

  validate(event, {
    sourceBucket: true,
    sourceKey: true,
    musicCredit: true,
    videoTitle: true,
  })

  .then(function(event) {
    localFilepath = "/tmp/" + path.basename(event.sourceKey);
    //download specified file
    return download(event, {
      srcBucket: event.sourceBucket,
      srcKey: event.sourceKey,
      downloadFilepath: localFilepath
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

  .then(function(event) {
    var def = Q.defer();
    //upload file from "/tmp/" + path.basename(event.sourceKey) to vimeo
    console.log('ready to upload to vimeo');

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
      }
      console.log(body);
      var uploadUrl = body.upload_link_secure;
      var completeUri = body.complete_uri;

      var readStream = fs.createReadStream(localFilepath)
      readStream.pipe(
        req({
          url: uploadUrl,
          method: "PUT",
          headers: {
            'Content-Type': mime.lookup(localFilepath),
            'Content-Length': getFilesizeInBytes(localFilepath)
          }
        }, function(err, response, body) {
          if (err) {
            def.reject(err)
          }
          console.log(response.statusCode);
          console.log('chunk uploaded?');
          console.log(body);

          req({
            url: uploadUrl,
            method: "PUT",
            headers: {
              'Content-Length': 0,
              'Content-Range': 'bytes */*'
            }
          }, function(err, response, bod) {
            if (err) {
              def.reject(err)
            } else if (response.statusCode !== 308) {
              def.reject("incomplete download")
            } else {
              console.log('308 means done done done');
              console.log(response.statusCode);
              console.log(bod);

              req({
                url: "https://api.vimeo.com" + completeUri,
                method: "DELETE",
                headers: {
                  'Authorization': 'bearer ' + vimeoCreds.accessToken
                }
              }, function(err, response, body) {
                if (err) {
                  def.reject(err)
                } else {

                  console.log('completely processed?');
                  console.log(response.statusCode);
                  console.log(body);

                  def.resolve(event)
                }
              })

            }
          })
        }));

      readStream.on('error', function(err) {
        console.log('error uploading');
        def.reject(err);
      });
      readStream.on('end', function() {
        console.log('readStream end');
      });

    })

    return def.promise;
  })

  .then(function(event) {
    context.done();
  })

  .fail(function(error) {
    console.log('error');
    console.log(error);
    context.done(null, error);
  })

}
