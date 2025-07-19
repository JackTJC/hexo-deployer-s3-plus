---

# Hexo Deployer for S3-Compatible Services

[![NPM version](https://img.shields.io/npm/v/hexo-deployer-s3-plus.svg?style=flat-square)](https://www.npmjs.com/package/hexo-deployer-s3-plus)
[![NPM downloads](https://img.shields.io/npm/dm/hexo-deployer-s3-plus.svg?style=flat-square)](https://www.npmjs.com/package/hexo-deployer-s3-plus)

English|[简体中文](README_zh.md)

This is a deployment plugin for [Hexo](https://hexo.io) that allows you to deploy your static site to any S3-compatible object storage service. It is built using the AWS SDK v3, ensuring modern features and robust performance.

This plugin is perfect for:
*   **AWS S3**
*   **Tebi.io**
*   **MinIO**
*   **Cloudflare R2**
*   **DigitalOcean Spaces**
*   And any other storage provider that exposes an S3-compatible API.

## Features

-   **Broad Compatibility**: Deploy to any S3-compatible service by simply providing an endpoint.
-   **Concurrent Uploads**: Utilizes `p-limit` to upload multiple files in parallel, significantly speeding up deployment.
-   **Sync with Deletion**: Automatically detects and deletes files from the bucket that are no longer present in your local build (`delete_removed`).
-   **Custom Headers**: Set custom HTTP headers (e.g., `Cache-Control`) for your files.
-   **Sub-directory Support**: Deploy your site into a specific prefix (sub-directory) within your bucket.
-   **Flexible Credential Handling**: Reads credentials from your `_config.yml`, environment variables, or AWS CLI profiles.

## Installation

```bash
npm install hexo-deployer-s3-plus --save
```

## Configuration

Add the following configuration to your `_config.yml` file.

### Example for a Generic S3 Service (like Teby.io, MinIO, R2)

This is the recommended configuration for any non-AWS S3 service.

```yaml
# _config.yml
deploy:
  type: s3
  bucket: your-bucket-name
  endpoint: https://s3.your-service-provider.com
  access_key_id: YOUR_ACCESS_KEY
  secret_access_key: YOUR_SECRET_KEY
  region: us-east-1 # This is often required by the SDK, but can be any string for non-AWS services.
  
  # Optional settings:
  concurrency: 20
  delete_removed: true
  prefix: blog/
```

### Example for AWS S3

```yaml
# _config.yml
deploy:
  type: s3
  bucket: your-aws-s3-bucket-name
  region: your-aws-region # e.g., us-west-2
  endpoint: https://s3.your-aws-region.amazonaws.com # The AWS S3 endpoint for your region
  
  # Credentials can be omitted if they are set as environment variables 
  # (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) or via an AWS profile.
  # access_key_id: YOUR_AWS_ACCESS_KEY_ID
  # secret_access_key: YOUR_AWS_SECRET_ACCESS_KEY
  
  # Optional settings:
  aws_cli_profile: my-work-profile # Use a specific profile from ~/.aws/credentials
  concurrency: 20
  delete_removed: true
```

## Usage

After configuring, you can deploy your site with the following command:

```bash
hexo clean && hexo generate && hexo deploy
```

## Options

| Parameter             | Required / Optional | Description                                                                                                                                                                                              |
| --------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bucket`              | **Required**        | The name of your S3 bucket.                                                                                                                                                                              |
| `endpoint`            | **Required**        | The S3 API endpoint URL of your storage provider. For AWS, this would be like `https://s3.us-east-1.amazonaws.com`.                                                                                      |
| `access_key_id`       | Optional            | Your access key. Can also be set via `aws_key`. Omit if using environment variables or an AWS profile.                                                                                                     |
| `secret_access_key`   | Optional            | Your secret key. Can also be set via `aws_secret`. Omit if using environment variables or an AWS profile.                                                                                                   |
| `region`              | Optional            | The region of your bucket. **Crucial for AWS S3**. For other S3 services, this can often be a placeholder string like `us-east-1`, but is still recommended.                                                 |
| `prefix`              | Optional            | A sub-directory inside your bucket where the files will be uploaded. E.g., `blog/`.                                                                                                                      |
| `concurrency`         | Optional            | The number of files to upload in parallel. Defaults to `20`.                                                                                                                                             |
| `delete_removed`      | Optional            | If `true`, files in the bucket that don't exist in your local `public` folder will be deleted upon deployment. **Defaults to `true`**. Set to `false` to disable this synchronization.                      |
| `headers`             | Optional            | A JSON object of HTTP headers to apply to all uploaded files. Useful for setting caching policies. Example: `headers: {"Cache-Control": "max-age=31536000"}`.                                                |
| `aws_cli_profile`     | Optional            | The name of a profile in your `~/.aws/credentials` file to use for authentication. Ignored if `access_key_id` and `secret_access_key` are provided directly.                                               |
| `aws_key`, `aws_secret` | Optional            | Legacy aliases for `access_key_id` and `secret_access_key` for backward compatibility.                                                                                                                   |

## Troubleshooting

-   **`TypeError: ... is not a function`**: This often happens with dependencies like `chalk` or `p-limit` due to module system conflicts (CommonJS vs. ES Modules). Ensure you are requiring them correctly, for example: `const pLimit = require('p-limit').default;`. If the problem persists, try installing a specific compatible version (e.g., `npm install chalk@4`).

-   **`Access Denied` / `403 Forbidden`**: This is almost always a permissions issue. Check that the API key (Access Key) you are using has the required permissions on the bucket:
    -   `s3:PutObject` (for uploading)
    -   `s3:ListBucket` (for checking files to delete)
    -   `s3:DeleteObject` (for deleting removed files)
    -   `s3:GetObject` (if you have any read operations, though not required for deploy)

-   **Connection Errors**: Double-check your `endpoint` URL for typos. Ensure there is no firewall blocking the connection to the endpoint.

## License

[MIT](https://opensource.org/licenses/MIT)