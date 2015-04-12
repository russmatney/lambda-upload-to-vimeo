var Q = require('q');
var path = require('path');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');
var mime = require('mime');
var fs = require('fs');

var superagent = require('superagent');

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

    superagent
      .post("https://api.vimeo.com/me/videos")
      .set('Authorization', 'bearer ' + vimeoCreds.accessToken)
      .send({type: 'streaming'})
      .end(function(err, res) {
        if (err) {
          def.reject(err);
        } else {
          console.log('res.body');
          console.log(res.body);

          superagent
            .put(res.body.upload_link_secure)
            .set('Authorization', 'bearer ' + vimeoCreds.accessToken)
            .set('Content-Type', mime.lookup(localFilepath))
            .set('Content-Length', getFilesizeInBytes(localFilepath))
            .send(localFilepath)
            .end(function(err, res) {
              if (err) {
                def.reject(err);
              } else {
                console.log('res.body');
                console.log(res.body);

                def.resolve(event);
              }
            })

        }
      });

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
