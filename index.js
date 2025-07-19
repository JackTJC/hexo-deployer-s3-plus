console.log('--- Hexo Deployer S3 plugin is being loaded! ---'); // <--- 添加这行

hexo.extend.deployer.register('s3', require('./lib/deployer'));