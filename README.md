# lambda-upload-to-vimeo

Lambda-func to upload a video to vimeo

# Usage

Invoke this function like any lambda function, as documented in the aws sdk.

- [JavaScript](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property)
- [Ruby](http://docs.aws.amazon.com/sdkforruby/api/Aws/Lambda/Client.html#invoke-instance_method)
- [PHP](http://docs.aws.amazon.com/aws-sdk-php/latest/class-Aws.Lambda.LambdaClient.html#_invokeAsync)
- [Python](http://boto.readthedocs.org/en/latest/)
- OR on the function's "edit" tab via amazon's interface
- OR via the AWS CLI

# Payload

## required

- `sourceBucket` - S3 bucket for the file to be uploaded
- `sourceKey` - S3 key for the file to be uploaded
- `videoDescription` - Vimeo metadata: Description for the video
- `videoTitle` - Vimeo metadata: Name of the video
