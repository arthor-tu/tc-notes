# 一、Spring基础
## 1.Spring基础配置
Spring框架本身有四大原则
- 使用POJO进行轻量级和最小侵入式开发。
- 通过依赖注入和基于接口编程实现松耦合。
- 通过AOP和默认习惯进行声明式编程。
- 使用AOP和模板(template)减少模块化代码。

### 1.1 依赖注入
在Spring环境中，常说的**控制翻转**（Inversion of Control-IOC）和**依赖注入**（dependency injection-DI）是等同的概念，控制翻转是通过依赖注入实现的。所谓**依赖注入**指的是容器负责创建对象和维护对象间的依赖关系，而不是通过对象本身负责自己的创建和解决自己的依赖。
依赖注入的主要目的是为了解耦，体现了一种组合的理念。
Spring IoC容器(ApplicationContext)负责创建Bean，并通过容器将功能类Bean注入到你需要的Bean中，Spring提供使用xml、注解、Java配置、groovy配置实现Bean的创建和注入。0-=