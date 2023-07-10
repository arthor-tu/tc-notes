# 四、SpringBoot 核心

## 1.基本配置

### 1.1 入口类和@ApringApplication

### 1.2 定制Baaner

- 修改src/main/resource/banner.txt
- 字符生成网站：<http://patorjk.com/software/taag/>
- 关闭banner

```java
SpringApplication app = new SpringApplication(MyApplication.class);
app.setShowBanner(false);
app.run(args);
```

或者

```java
new SpringApplication(MyApplication.class).setShowBanner(false).run(args);
```

### 1.3 SpringBoot的配置文件
Spring Boot 使用一个全局的配置文件 application.properties 或 application.yml, 置于src/main/resources目录或者类路径的/config下。

## 2 外部配置

SpringBoot 还允许允许使用properties文件、yaml文件、命令行参数作为外部配置。

### 2.1 命令行参数配置

SpringBoot 可以是基于jar包运行的，运行命令为：

```shell
java -jar xx.jar
```

可以通过以下命令修改Tomcat端口号

```shell
java -jar xx.jar --server.port=9090
```
