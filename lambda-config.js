module.exports = {
  FunctionName: 'upload-to-vimeo',
  Handler: 'index.handler',
  Region: 'us-east-1',
  Runtime: 'nodejs',
  Role: 'arn:aws:iam::106586740595:role/executionrole',
  MemorySize: 1024,
  Timeout: 60
}
