var Q = require('q');
var validate = require('lambduh-validate');
var download = require('lambduh-get-s3-object');

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
    //upload file from "/tmp/" + path.basename(event.sourceKey) to vimeo
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
