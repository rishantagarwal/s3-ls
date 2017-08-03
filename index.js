var _ = require('lodash');
var assert = require('assert');

module.exports = function (options) {
  assert(options && typeof options.bucket === 'string');
  var bucket = options.bucket;
  var s3 = options.s3 || new (require('aws-sdk').S3)({apiVersion: '2006-03-01'});

  return {
    ls: function ls(path) {
      var prefix = _.trimStart(_.trimEnd(path, '/') + '/', '/');
      var result = {files: [], folders: []};

      function s3ListCheckTruncated(data) {
        result.files = result.files.concat(_.map(data.Contents, 'Key'));
        result.folders = result.folders.concat(_.map(data.CommonPrefixes, 'Prefix'));

        if (data.IsTruncated) {
          return s3.listObjectsV2({
            Bucket: bucket,
            MaxKeys: 2147483647, // Maximum allowed by S3 API
            Delimiter: '/',
            Prefix: prefix,
            ContinuationToken: data.NextContinuationToken
          }).promise()
          .then(s3ListCheckTruncated);
        }

        return result;
      }

      return s3.listObjectsV2({
        Bucket: bucket,
        MaxKeys: 2147483647, // Maximum allowed by S3 API
        Delimiter: '/',
        Prefix: prefix,
        StartAfter: prefix // removes the folder name from listing
      }).promise()
      .then(s3ListCheckTruncated);
    }
  };
};
