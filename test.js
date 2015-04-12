console.log('running test file');

var input = {
  "sourceBucket": "russbosco",
  "sourceKey": "events/awesomeparty201/timelapse/timelapse-final.mp4",
  "musicCredit": "Music Credit",
  "videoTitle": "Video Title"
}

var index = require('./')


index.handler(input, {
  done: function() {
    console.log('done called');
  }
})
