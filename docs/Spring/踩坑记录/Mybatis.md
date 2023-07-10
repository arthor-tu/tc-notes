# Mybatis踩坑记录

## 1.传参有值，但在sql语句中为默认值

2023-07-09

### 问题描述
- 实体类
```java
public class CommentFVo {
    private int blogId=-1;
    private int parentId = -1;
    private int userId = -1;
    private String comment;
    /**
     * 用户名
     */
    String name;
    /**
     * 网站名
     */
    String website;
    /**
     * 邮箱
     */
    String email;
}
```
- mybatis模板
```xml
    <select id="getList" parameterType="com.example.blogservice.dto.CommentDto" resultMap="CommentVoMap">
        select c.*, u.name as name, u.website as website, u.email as email
        from comment c left join user u on c.user_id=u.id
        where c.is_deleted = 0
        <if test="blogId!=null and blogId!=-1">
            and c.blog_id=#{blogId}
        </if>
        <if test="orderBy!=null and orderBy!=''">
            order by #{orderBy}
        </if>
        <if test="blogId=null or blogId=-1">
            limit #{start}, #{size}
        </if>
    </select>
```
### 实际请求查询语句

可以看到，#{blogId}实际传入的值为334122，但在在实际查询语句中变为了-1。
```
==>  Preparing: select c.*, u.name as name, u.website as website, u.email as email from comment c left join user u on c.user_id=u.id where c.is_deleted = 0 and c.blog_id=? order by ? limit ?, ?
==> Parameters: -1(Integer),  c.create_time desc(String), 0(Integer), 10(Integer)
<==      Total: 0
```
### 问题原因
```
        <if test="blogId=null or blogId=-1">
            limit #{start}, #{size}
        </if>
```
上述if判断语句中使用了=，在该标签=并不是等于的逻辑判断，而是复制语句，导致在最后将blogId的值赋值为了-1.修改为==逻辑判断即解决问题。
