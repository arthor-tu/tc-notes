/*
 * @Author: lcm
 * @Date: 2022年8月
 * @LastEditors: tcq
 * @LastEditTime: 2023-01-29 15:56:29
 * @Description: 前端代码自动化部署脚本
 * @Version: 1.0.4
 * @Updates:
 * 2022-08 v1.0.0： 初始版本
 * 2022-09 v1.0.1:  新增指定部署文件夹
 * 2022-09-27 v1.0.2:  修复配置文件指定备份路径时，备份失败的问题
 * 2022-11-10 v1.0.3:  新增钩子函数
 * 2022-11-16 v1.0.4:  判断部署目录是否存在
 */

// npm i archiver@5.3.1 chalk@4.1.2 ora@5.1.0 ssh2@0.8.9 -D

const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const readline = require("readline");

// const chalk = require("chalk");
const archiver = require("archiver");
const ora = require("ora");
const Client = require("ssh2").Client;

// node 终端提示语，process.env：当前进程环境
const spinner = ora();
const isAgent = new RegExp(/agent/).test(process.env.npm_lifecycle_event);

/**
 * @typedef {object} DeployConfig
 * @property {string} name 部署环境名称
 * @property {string} host 主机地址
 * @property {string} port 端口
 * @property {string} username 用户名
 * @property {string} [password] 密码
 * @property {string} deployPath 部署路径，路径的最后一个文件夹为部署文件夹
 * @property {string} backupPath 备份路径
 * @property {string} buildCmd 编译命令，实际运行为npm run $buildCmd
 * @property {Function} deployBefore
 * @property {Function} buildBefore
 * @property {Function} buildAfter
 * @property {Function} uploadBefore
 * @property {Function} uploadAfter
 * @property {Function} backupBefore
 * @property {Function} backupAfter
 * @property {Function} deployAfter
 */

/**
 * 封装ssh连接
 */
class SSHClient {
  /**
   * 目标机
   * @type {Client}
   */
  client;
  /**
   * 跳板机
   * @type {Client}
   */
  clientAgent;
  config;

  constructor({ host, port, username, password, privateKey, agent }) {
    this.config = {
      host,
      port,
      username,
      password,
      privateKey,
    };

    // this.hasAgent = !!(agent || Config.agent)
    this.hasAgent = isAgent;

    if (this.hasAgent) {
      this.clientAgent = new Client(); // 连接跳板机
      this.client = new Client(); // 连接目标机
      this.agent = agent || Config.agent; // 环境配置里的该项配置权重更高
    } else {
      this.client = new Client();
    }
  }

  /** 连接服务器 */
  connect() {
    return new Promise((resolve, reject) => {
      const client = this.hasAgent ? this.clientAgent : this.client;
      const connectData = this.hasAgent ? this.agent : this.config;

      // console.log(chalk.green('[SSHClient]: SSH连接开始', this.config))
      client
        .on("ready", () => {
          if (this.hasAgent) {
            // console.log(chalk.green('[SSHClient]: 连接跳板机成功'))
            client.forwardOut(
              "127.0.0.1",
              12345,
              this.config.host,
              this.config.port,
              (err, stream) => {
                if (err) {
                  client.end();
                  reject(err);
                }
                // 连接目标机
                this.client
                  .on("ready", () => {
                    // console.log(chalk.green('[SSHClient]: 连接目标机成功！'))
                    resolve(true);
                  })
                  .on("error", (err) => {
                    reject(err);
                  })
                  .on("end", () => {
                    // console.log(chalk.red('[SSHClient]: 目标SSH连接结束！'))
                  })
                  .on("close", () => {
                    // console.log(chalk.red('[SSHClient]: 目标SSH连接关闭！'))
                  })
                  .connect({
                    sock: stream,
                    username: this.config.username,
                    password: this.config.password,
                  });
              }
            );
          } else {
            resolve(true);
          }
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => {
          // console.log(chalk.red('[SSHClient]: 目标SSH连接结束！'))
        })
        .on("close", () => {
          // console.log(chalk.red('[SSHClient]: 目标SSH连接关闭！'))
        })
        .connect(connectData);
    });
  }

  // 上传文件
  uploadFile({ localPath, remotePath }) {
    return new Promise((resolve, reject) => {
      return this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
        } else {
          sftp.fastPut(localPath, remotePath, (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(true);
          });
        }
      });
    });
  }

  /**
   * 执行ssh命令
   * @param {string} command
   * @returns {Promise<>}
   */
  execSSH(command) {
    return new Promise((resolve, reject) => {
      return this.client.exec(command, (err, stream) => {
        if (err || !stream) {
          reject(err);
        } else {
          stream
            .on("close", (code, signal) => {
              resolve(true);
            })
            .on("data", function (data) {
              // console.log(data.toString())
            })
            .stderr.on("data", function (data) {
              reject(data.toString());
            });
        }
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.client.end();
    if (this.clientAgent) {
      this.clientAgent.end();
    }
  }
}

/**
 * 自动化构建
 */
class AutoBuild {
  constructor(fileName) {
    this.fileName = fileName;
  }

  // 删除本地文件
  deleteZip() {
    return new Promise((resolve, reject) => {
      fs.unlink(this.outputZipPath, function (error) {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  zip(inputPath = "dist/", outputPath = "", level = 9) {
    if (this.outputZipPath) {
      this.deleteZip();
      this.outputZipPath = null;
    }

    this.outputZipPath = path.resolve(outputPath, this.fileName);

    return new Promise((resolve, reject) => {
      // 创建文件输出流
      const output = fs.createWriteStream(
        path.resolve(__dirname, outputPath, this.fileName)
      );
      const archive = archiver("zip", {
        zlib: { level: level || 9 }, // 设置压缩级别
      });
      // 文件输出流结束
      output.on("close", function () {
        // console.log(
        //   chalk.green(`[AutoBuild]: 压缩文件总共 ${archive.pointer()} 字节----`)
        // )
        // console.log(chalk.green('[AutoBuild]: 压缩文件夹完毕'))
        resolve(archive.pointer());
      });
      // 数据源是否耗尽
      output.on("end", function () {
        // console.log(chalk.red('[AutoBuild]: 压缩失败，数据源已耗尽'))
        reject();
      });
      // 存档警告
      archive.on("warning", function (err) {
        if (err.code === "ENOENT") {
          // console.log(chalk.red('[AutoBuild]: stat故障和其他非阻塞错误'))
        } else {
          // console.log(chalk.red('[AutoBuild]: 压缩失败'))
        }
        reject(err);
      });
      // 存档出错
      archive.on("error", function (err) {
        // console.log(chalk.red('[AutoBuild]: 存档错误，压缩失败 -> ', err))
        reject(err);
      });
      // 通过管道方法将输出流存档到文件
      archive.pipe(output);

      // 打包dist里面的所有文件和目录
      archive.directory(inputPath, false);
      // archive.directory(`../${Config.buildDist}/`, false)

      // 完成归档
      archive.finalize();
    });
  }

  build(buildCmd = "build") {
    // console.log(chalk.blue('[AutoBuild]: 开始编译项目'))
    return new Promise((resolve, reject) => {
      exec("npm run " + buildCmd, (error, stdout, stderr) => {
        if (error) {
          // console.error(error)
          reject(error);
        } else if (stdout) {
          resolve(stdout);
          // console.log(chalk.green('[AutoBuild]: 编译完成'))
        } else {
          // console.error(stderr)
          reject(stderr);
        }
      });
    });
  }

  start() {}
}

/**
 * @param {DeployConfig} config
 * @param {'deployBefore'|'buildBefore'|'buildAfter'|'uploadBefore'|'uploadAfter'|'deployAfter'} name
 */
async function runCallback(config, name) {
  try {
    config[name] && (await config[name]());
  } catch (error) {
    throw new Error(`${name} -> ${error.message}`);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 *
 * @param {DeployConfig} config
 * @param {boolean} backup
 * @returns
 */
async function AutoDeploy(config, backup) {
  const localFileName = "dist.zip";

  await runCallback(config, "deployBefore");

  // 删除尾部斜杠
  let deployPath = config.deployPath?.trim().replace(/[/]$/gim, ""),
    deployFolder;

  const deployPathArr = deployPath.split("/");

  deployFolder = deployPathArr.pop();
  deployPath = deployPathArr.join("/") + "/";

  let uploadFileName = `autodeploy_${deployFolder}.zip`;

  spinner.info("部署路径 -> " + deployPath);
  spinner.info("部署文件夹 -> " + deployFolder);

  if (!deployPath || !deployFolder) {
    throw new Error("[AutoDeploy] 部署路径或文件夹错误");
  }

  const autoBuild = new AutoBuild(localFileName);

  spinner.start(
    `[AutoDeploy] 编译项目中 -> npm run ${config.buildCmd || "build"}`
  );
  await runCallback(config, "buildBefore");
  try {
    await autoBuild.build(config.buildCmd);
  } catch (error) {
    spinner.fail("[AutoDeploy] 编译失败 ->" + error);
    throw "";
  }
  await runCallback(config, "buildAfter");
  spinner.succeed(
    `[AutoDeploy] 编译项目成功 -> npm run ${config.buildCmd || "build"}`
  );

  spinner.start(`[AutoDeploy] 压缩项目中 -> ${localFileName}`);
  try {
    let size = await autoBuild.zip();
    spinner.succeed(
      `[AutoDeploy] 压缩项目成功，大小为${size / 1024}KB -> ${localFileName}`
    );
  } catch (error) {
    spinner.fail("[AutoDeploy] 压缩失败 ->" + error);
    throw "";
  }

  const sshClient = new SSHClient(config);

  spinner.start(
    `[AutoDeploy] 正在通过SSH2连接服务器 -> ${config.host}:${config.port}`
  );
  try {
    await sshClient.connect();
  } catch (error) {
    spinner.fail("[AutoDeploy] 连接服务器失败 -> " + error);
    throw "";
  }
  spinner.succeed(
    `[AutoDeploy] 连接到服务器成功 -> ${config.host}:${config.port}`
  );

  let hasDeployFolder = false;

  spinner.start(
    `[AutoDeploy] 检测部署文件夹是否存在 -> ${deployPath}${deployFolder}`
  );
  try {
    await sshClient.execSSH(`stat ${deployPath}${deployFolder}`);
    hasDeployFolder = true;
  } catch (error) {
    spinner.fail("[AutoDeploy] 部署文件夹不存在，请先创建");
    throw "";
  }

  if (backup) {
    spinner.start("[AutoDeploy] 连接服务器成功，开始备份");
    try {
      if (hasDeployFolder) {
        await runCallback(config, "backupBefore", sshClient);
        const backupPath = (config.backupPath || deployPath)
          .trim()
          .replace(/[/]$/gim, "");

        spinner.info("备份文件夹 -> " + backupPath);

        let backupName = `${deployFolder}_backup_${startTime
          .toLocaleString()
          .replace(" ", "_")
          .replace(/[/:]/gim, "_")}`;
        await sshClient.execSSH(
          `cp -r ${deployPath}${deployFolder} ${backupPath}/${backupName}`
        );

        // await sshClient.execSSH(`mkdir -p ${backupPath}/${backupName} && cp -r ${deployPath}${deployFolder} "$_"`)
        spinner.succeed(
          `[AutoDeploy] 备份当前版本成功 -> ${backupPath}/${backupName}`
        );
        await runCallback(config, "backupAfter", sshClient);
      }
    } catch (error) {
      spinner.fail("[AutoDeploy] 备份失败 -> " + error);
      throw "";
    }
  }

  await runCallback(config, "uploadBefore", sshClient);
  spinner.start(
    `[AutoDeploy] 上传文件中: ${path.resolve(
      __dirname,
      localFileName
    )} -> ${deployPath}${uploadFileName}  `
  );
  try {
    await sshClient.uploadFile({
      localPath: path.resolve(__dirname, localFileName),
      remotePath: `${deployPath}${uploadFileName}`,
    });
  } catch (error) {
    spinner.fail("[AutoDeploy] 上传文件失败 -> " + error);
    throw "";
  }
  spinner.succeed(
    `[AutoDeploy] 上传文件成功 -> ${deployPath}${uploadFileName}`
  );
  await runCallback(config, "uploadAfter", sshClient);

  spinner.start("[AutoDeploy] 开始解压文件");
  try {
    // 先解压到临时文件夹，防止执行失败导致web无法访问
    let tempFolder = `autodeploy_${deployFolder}_temp`;
    let unzipCmd = `unzip -o ${deployPath + uploadFileName} -d ${
      deployPath + tempFolder
    }`;
    await sshClient.execSSH(unzipCmd);
    // 解压成功后再重命名临时文件夹
    await sshClient.execSSH(
      `cd ${deployPath};rm -rf ${deployFolder};mv -f ${tempFolder} ${deployFolder}`
    );
  } catch (error) {
    spinner.fail("[AutoDeploy] 解压文件失败 -> " + error);
    throw "";
  }
  spinner.succeed("[AutoDeploy] 解压文件成功");

  spinner.start("[AutoDeploy] 删除上传到服务器的文件");
  try {
    await sshClient.execSSH(`rm -rf ${deployPath}${uploadFileName}`);
  } catch (error) {
    spinner.fail("[AutoDeploy] 删除失败 -> " + error);
    throw "";
  }
  spinner.succeed("[AutoDeploy] 删除上传的压缩包成功");

  spinner.start("[AutoDeploy] 删除本地压缩包中");
  try {
    await autoBuild.deleteZip();
  } catch (error) {
    spinner.fail("[AutoDeploy] 删除本地压缩包失败 -> " + error);
    throw "";
  }
  spinner.succeed(`[AutoDeploy] 删除本地压缩包成功 -> ${localFileName}`);

  await sshClient.disconnect();

  if (typeof config.after === "function") {
    await config.deployAfter();
  }
  return true;
}

if (!fs.existsSync("./deploy.config.js")) {
  spinner.fail("未找到配置文件：deploy.config.js");
  return;
}

const startTime = new Date();

const deployConfigDic = require("./deploy.config.js");

const params = process.argv.slice(2);

const [deployEnv, backup] = params;
console.log("是否开启备份: ", backup ? "是" : "否");

let values = Object.values(deployConfigDic);

spinner.info(
  `当前配置文件共有${values.length}种部署环境 -> ${values
    .map((item) => item.name)
    .join(",")}`
);
let config = deployConfigDic[deployEnv];

if (config == null) {
  spinner.fail("[AutoDeploy] 在配置文件未找到此部署环境 -> " + deployEnv);
  return;
}

spinner.info(`当前部署部署环境为 -> ${config.name}`);

AutoDeploy(config, backup)
  .then((result) => {
    if (result) {
      spinner.succeed(
        `[AutoDeploy] 部署到${config.name}成功 -> ` +
          new Date().toLocaleString()
      );
    }
  })
  .catch((error) => {
    spinner.fail(`[AutoDeploy] 部署到${config.name}失败 -> ` + error);
  })
  .finally(() => {
    spinner.info(`[AutoDeploy] 总耗时：${(new Date() - startTime) / 1000}秒`);
    spinner.stop();
    return true;
  });
