var Q = require('q');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');

var vimeoCreds = {
  accessToken: "55a8d1476ec34778e207a4fb59cb4d5a",
  clientId: "3a122cf8c0b2e69c14898dc40dbdd828e3407d44",
  clientSecrets: "0MOZIAxP+5qMbPG1V/TH4P0hbgkZsgBdYPsSZFUSN3FVvWAzjOT7QWr43AK0Pb765lJDRWM8asPLxzjwVSgN5Nb3fIm9qnS1puioDnSPpdFbRBb1TvVxpBg5hnuKKIw7",

}

var Vimeo = require('vimeo-api').Vimeo;
var vimeo = new Vimeo(
  vimeoCreds.clientId,
  vimeoCreds.clientSecrets,
  vimeoCreds.accessToken
);

exports.handler = function(event, context) {
  validate(event, {
    sourceBucket: true,
    sourceKey: true,
    musicCredit: true,
    videoTitle: true,
  })

  .then(function(event) {
    //download specified file
    return download(event, {
      srcBucket: event.sourceBucket,
      srcKey: event.sourceKey,
      downloadFilepath: "/tmp/" + path.basename(event.sourceKey)
    })
  })

  .then(function(event) {
    var def = Q.defer();
    //upload file from "/tmp/" + path.basename(event.sourceKey) to vimeo
    console.log('ready to upload to vimeo');

    vimeo.streamingUpload("/tmp/" + path.basename(event.sourceKey),
      function(err, body, status_code, headers) {
        if (err) {
          def.reject(err);
        } else {
          console.log('streamingUpload success');
          vimeo.request(headers.location, function(err, body, status_code, headers) {
            if (err) {
              def.reject(err);
            } else {
              console.log('second request success');
              def.resolve(event);
            }
          })
        }
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
