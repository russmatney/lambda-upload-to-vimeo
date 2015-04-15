console.log('running test file');

var input = {
  "sourceBucket": "russbosco",
  "sourceKey": "events/Legends of Felda/timelapse/video-0.mp4",
  "videoDescription": "Music Credit for mah homies",
  "videoTitle": "legiondhairy"
}

var index = require('./')


index.handler(input, {
  done: function() {
    console.log('done called');
  }
})
