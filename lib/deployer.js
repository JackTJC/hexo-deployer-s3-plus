const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const klawSync = require('klaw-sync');
const mime = require('mime-types'); 
const chalk = require('chalk').default; 
const pLimit = require('p-limit').default; 

module.exports = async function(args) {
  const log = this.log;
  const publicDir = this.config.public_dir;

  // --- 1. 配置检查 ---
  const {
    bucket,
    region,
    concurrency = 20,
    prefix,
    aws_cli_profile,
    headers,
    delete_removed,
    endpoint,
    access_key_id,
    secret_access_key,
    aws_key,
    aws_secret
  } = args;

  if (!bucket || !endpoint) {
    log.error('Bucket and Endpoint must be configured in _config.yml');
    log.info(chalk.bold('--- Generic S3-Compatible Service Example (like Teby, MinIO, Cloudflare R2) ---'));
    log.info('  deploy:');
    log.info('    type: s3');
    log.info('    bucket: <your-bucket-name>');
    log.info('    endpoint: <your-s3-endpoint>');
    log.info('    access_key_id: <your-access-key>');
    log.info('    secret_access_key: <your-secret-key>');
    log.info('    region: <any-string-is-ok-e.g.-us-east-1>');
    log.info('    [prefix]: <prefix>');
    log.info('    [concurrency]: 20');
    log.info('    [delete_removed]: true');
    log.info('');
    log.info(chalk.bold('--- AWS S3 Example ---'));
    log.info('  deploy:');
    log.info('    type: s3');
    log.info('    bucket: <your-aws-bucket-name>');
    log.info('    region: <your-aws-region>');
    log.info('    endpoint: <s3.your-aws-region.amazonaws.com>');
    log.info('    # Credentials can be from env vars, ~/.aws/credentials, or here:');
    log.info('    # access_key_id: <your-aws-key>');
    log.info('    # secret_access_key: <your-aws-secret>');
    return;
  }

  // --- 2. 创建 S3 客户端 ---
  const s3Config = {
    region: region || 'us-east-1',
    endpoint: endpoint,
  };

  const keyId = access_key_id || aws_key;
  const secret = secret_access_key || aws_secret;

  if (keyId && secret) {
    s3Config.credentials = {
        accessKeyId: keyId,
        secretAccessKey: secret
    };
    log.info('Using credentials from _config.yml.');
  } else if (aws_cli_profile) {
    process.env.AWS_PROFILE = aws_cli_profile;
    log.info(`Using AWS profile: ${aws_cli_profile}`);
  } else {
    log.info('Using credentials from environment variables or IAM role.');
  }

  const client = new S3Client(s3Config);

  // --- 3. 准备文件列表 ---
  const filesToUpload = klawSync(publicDir, { nodir: true });
  const remotePrefix = prefix || '';
  const shouldDeleteRemoved = delete_removed !== false;

  if (!fs.existsSync(publicDir)) {
    log.error(`Public folder not found: ${publicDir}. Run 'hexo generate' first.`);
    return;
  }

  log.info(`Found ${filesToUpload.length} files in ${publicDir}`);

  // --- 4. 实现 delete_removed (可选) ---
  if (shouldDeleteRemoved) {
    log.info('Checking for files to delete on S3...');
    try {
      const s3Objects = await listAllObjects(client, bucket, remotePrefix);
      const localFilesSet = new Set(
        filesToUpload.map(file => path.join(remotePrefix, path.relative(publicDir, file.path)).replace(/\\/g, '/'))
      );
      
      const objectsToDelete = s3Objects
        .filter(obj => !localFilesSet.has(obj.Key))
        .map(obj => ({ Key: obj.Key }));

      if (objectsToDelete.length > 0) {
        log.info(`Deleting ${objectsToDelete.length} removed files from S3...`);
        for (let i = 0; i < objectsToDelete.length; i += 1000) {
            const chunk = objectsToDelete.slice(i, i + 1000);
            await client.send(new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: chunk },
            }));
        }
      } else {
        log.info('No files to delete.');
      }
    } catch (err) {
      log.error('Failed to check/delete removed files. Please check your permissions.');
      log.error(err);
    }
  }

  // --- 5. 执行上传 ---
  const limit = pLimit(concurrency);
  log.info(`Uploading to bucket: ${chalk.cyan(bucket)} via endpoint: ${chalk.cyan(endpoint)}`);

  const uploadPromises = filesToUpload.map(file => {
    return limit(() => {
      const key = path.join(remotePrefix, path.relative(publicDir, file.path)).replace(/\\/g, '/');
      const body = fs.createReadStream(file.path);
      const contentType = mime.lookup(file.path) || 'application/octet-stream';

      const upload = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ...headers
        },
      });

      return upload.done().then(() => {
        log.info(`Uploaded: ${key}`);
      });
    });
  });

  try {
    await Promise.all(uploadPromises);
    log.info(chalk.green('All files uploaded successfully!'));
  } catch (err) {
    log.error('An error occurred during upload:');
    log.error(err);
    throw new Error('S3 deployment failed.');
  }
};

/**
 * Helper function to list all objects in an S3 bucket with a given prefix,
 * handling pagination automatically.
 */
async function listAllObjects(client, bucket, prefix) {
  const allObjects = [];
  let isTruncated = true;
  let continuationToken;

  while (isTruncated) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
    
    if (Contents) {
      allObjects.push(...Contents);
    }
    isTruncated = IsTruncated;
    continuationToken = NextContinuationToken;
  }
  return allObjects;
}