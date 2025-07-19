[![NPM version](https://img.shields.io/npm/v/hexo-deployer-s3-plus.svg?style=flat-square)](https://www.npmjs.com/package/hexo-deployer-s3-plus)
[![NPM downloads](https://img.shields.io/npm/dm/hexo-deployer-s3-plus.svg?style=flat-square)](https://www.npmjs.com/package/hexo-deployer-s3-plus)

这是一款为 [Hexo](https://hexo.io) 设计的部署插件，它允许您将静态网站部署到任何与 S3 兼容的对象存储服务。它基于 AWS SDK v3 构建，确保了现代化的功能和强大的性能。

这款插件完美适用于：
*   **AWS S3**
*   **Teby.io**
*   **MinIO**
*   **Cloudflare R2**
*   **DigitalOcean Spaces**
*   以及任何其他提供 S3 兼容 API 的存储服务。

## 功能特性

-   **广泛的兼容性**: 只需提供一个端点（endpoint），即可部署到任何兼容 S3 的服务。
-   **并发上传**: 利用 `p-limit` 并行上传多个文件，显著提升部署速度。
-   **同步删除**: 自动检测并删除存储桶中那些在本地构建目录已不存在的文件 (`delete_removed`)。
-   **自定义头信息**: 为您的文件设置自定义 HTTP 头（例如 `Cache-Control`）。
-   **支持子目录**: 将您的网站部署到存储桶内的指定前缀（子目录）下。
-   **灵活的凭证处理**: 可从 `_config.yml`、环境变量或 AWS CLI 配置文件中读取凭证。

## 安装

```bash
npm install hexo-deployer-s3-plus --save
```

## 配置

将以下配置添加到您的 `_config.yml` 文件中。

### 通用 S3 服务配置示例 (如 Teby.io, MinIO, R2)

对于任何非 AWS 的 S3 服务，推荐使用此配置。

```yaml
# _config.yml
deploy:
  type: s3
  bucket: your-bucket-name                       # 你的存储桶名称
  endpoint: https://s3.your-service-provider.com  # 你的服务商提供的 S3 端点
  access_key_id: YOUR_ACCESS_KEY                  # 你的 Access Key
  secret_access_key: YOUR_SECRET_KEY              # 你的 Secret Key
  region: us-east-1 # SDK 通常需要这个字段，但对于非 AWS 服务，它可以是任意字符串
  
  # 可选设置:
  concurrency: 20      # 并发上传数量
  delete_removed: true # 是否删除云端多余文件
  prefix: blog/        # 上传到存储桶的子目录
```

### AWS S3 配置示例

```yaml
# _config.yml
deploy:
  type: s3
  bucket: your-aws-s3-bucket-name # 你的 AWS S3 存储桶名称
  region: your-aws-region         # 你的 AWS 区域, e.g., us-west-2
  endpoint: https://s3.your-aws-region.amazonaws.com # 对应区域的 AWS S3 端点
  
  # 如果凭证已设置为环境变量 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) 
  # 或通过 AWS profile 配置，则此处可以省略
  # access_key_id: YOUR_AWS_ACCESS_KEY_ID
  # secret_access_key: YOUR_AWS_SECRET_ACCESS_KEY
  
  # 可选设置:
  aws_cli_profile: my-work-profile # 使用 ~/.aws/credentials 文件中的特定 profile
  concurrency: 20
  delete_removed: true
```

## 使用方法

配置完成后，您可以通过以下命令来部署您的网站：

```bash
hexo clean && hexo generate && hexo deploy
```

## 配置选项

| 参数                  | 必需 / 可选 | 描述                                                                                                                                                                                                             |
| --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bucket`              | **必需**    | 您的 S3 存储桶的名称。                                                                                                                                                                                           |
| `endpoint`            | **必需**    | 您的存储服务商提供的 S3 API 端点 URL。对于 AWS，它类似于 `https://s3.us-east-1.amazonaws.com`。                                                                                                                    |
| `access_key_id`       | 可选        | 您的访问密钥。也可以通过 `aws_key` 设置。如果使用环境变量或 AWS profile，则可省略。                                                                                                                               |
| `secret_access_key`   | 可选        | 您的私有密钥。也可以通过 `aws_secret` 设置。如果使用环境变量或 AWS profile，则可省略。                                                                                                                             |
| `region`              | 可选        | 您的存储桶所在的区域。**对于 AWS S3 至关重要**。对于其他 S3 服务，这通常可以是一个占位符字符串（如 `us-east-1`），但仍建议填写。                                                                                   |
| `prefix`              | 可选        | 文件将被上传到的存储桶内的子目录。例如：`blog/`。                                                                                                                                                               |
| `concurrency`         | 可选        | 并行上传的文件数量。默认为 `20`。                                                                                                                                                                                |
| `delete_removed`      | 可选        | 如果为 `true`，部署时将自动删除存储桶中存在但本地 `public` 文件夹中不存在的文件。**默认为 `true`**。设置为 `false` 可禁用此同步功能。                                                                            |
| `headers`             | 可选        | 应用于所有已上传文件的 HTTP 头的 JSON 对象。可用于设置缓存策略。示例：`headers: {"Cache-Control": "max-age=31536000"}`。                                                                                              |
| `aws_cli_profile`     | 可选        | 您 `~/.aws/credentials` 文件中用于身份验证的 profile 名称。如果直接提供了 `access_key_id` 和 `secret_access_key`，则此项将被忽略。                                                                                  |
| `aws_key`, `aws_secret` | 可选        | `access_key_id` 和 `secret_access_key` 的旧别名，用于向后兼容。                                                                                                                                                  |

## 问题排查

-   **`TypeError: ... is not a function`**: 此类错误通常由 `chalk` 或 `p-limit` 等依赖的模块系统冲突 (CommonJS vs. ES Modules) 引起。请确保您以正确的方式引入它们，例如：`const pLimit = require('p-limit').default;`。如果问题依旧存在，请尝试安装一个特定的兼容版本（例如 `npm install chalk@4`）。

-   **`Access Denied` / `403 Forbidden` (访问被拒绝)**: 这几乎总是权限问题。请检查您使用的 API 密钥 (Access Key) 是否在存储桶上具有所需的权限：
    -   `s3:PutObject` (用于上传)
    -   `s3:ListBucket` (用于检查待删除文件)
    -   `s3:DeleteObject` (用于删除文件)
    -   `s3:GetObject` (如果涉及读取操作，尽管部署时非必需)

-   **Connection Errors (连接错误)**: 仔细检查您的 `endpoint` URL 是否有拼写错误。确保没有防火墙阻止与该端点的连接。

## 许可证

[MIT](https://opensource.org/licenses/MIT)