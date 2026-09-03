import { FrontendApplicationContribution } from '@MagicIdea/core';
import { inject, injectable } from 'inversify';
import { PromptService } from '@MagicIdea/ai-core/common';

/**
 * 给 AI 注入 MagicScript 语法规则
 * 让所有 AI 自动学习你的语言
 */
@injectable()
export class MagicScriptPromptContribution implements FrontendApplicationContribution {

    @inject(PromptService)
    protected readonly promptService: PromptService;

    onStart(): void {
        this.registerMagicScriptSyntaxPrompt();
    }

    /**
     * 注册 MagicScript 语法提示（AI 会自动加载）
     */
    protected registerMagicScriptSyntaxPrompt(): void {
        const syntaxPrompt = this.getMagicScriptSyntaxPrompt();

        // 注册成全局内置提示
        this.promptService.addBuiltInPromptFragment(
            {
                id: 'magicscript-language',
                template: syntaxPrompt,
            },
            'magicscript-language',
            true
        );
    }

    /**
     * ==============================
     * 这里就是你的 MagicScript 语法书
     * ==============================
     */
    protected getMagicScriptSyntaxPrompt(): string {
        const name = "MagicScript";
        const description = "MagicScript的语法规范说明";
        return `---
name: ${name}
description: ${description}
---
## magicscript核心语法强制规范（100%遵守，优先级最高）
### 1. 关键字与基础规则
- **关键字范围**：仅允许使用 var/let/const/if/else/for/in/continue/break/exit/try/catch/finally/import/as/new/true/false/null/async/return，禁止混用其他语言关键字（如 function）。
- **变量定义**：仅用 var 关键字，格式为 var 变量名 = 值，必须以分号结尾。示例：var userId = 123; var userName = 'admin';。
- **语句分隔**：所有语句必须以分号结尾，换行仅作为代码可读性分隔，不替代分号；代码块必须用 {} 包裹（如 if/for/Lambda/函数体）。
- **注释规则（支持补全）**：
  - 单行注释：// 注释内容（用于单行代码说明、临时禁用代码，补全需延续语义，如 // 处理用户数据 → 补全 // 处理用户数据：过滤空值，提取姓名）；
  - 多行注释：/* 注释内容（支持换行）*/（用于函数说明、复杂逻辑解释，补全需分点清晰，如 /* 获取用户列表 → 补全 /* 获取用户列表\n * @param page 页码（1开始）\n * @param size 每页条数（默认10）\n */）；
  - 注释需与代码对齐，单行注释不超过50字，避免冗余。
- **接口参数获取规则 **：
请求类型	参数获取方式	适用场景	示例
POST/PUT	body.参数名（请求体参数）	提交/修改数据（复杂参数）	var productId = body.product_id;
GET/DELETE	参数名（URL 参数）	查询/删除数据（简单参数）	var orderId = order_id;

### 2. 运算符规范
| 运算符类型   | 支持符号与示例                          | 注意事项                                  |
|--------------|---------------------------------------|---------------------------------------|
| 数学运算     | +/-/*///%，++/--，+=/-=/*=//=/%= | 10++ 合法，++10 非法；+= 等需紧跟变量（如 num += 5） |
| 比较运算     | </<=/>/>=/==/!=/===/!== | === 严格比较类型与值，== 仅比较值 |
| 逻辑运算     | &&/||/!                          | 不强制要求布尔类型（如 var a = 1; if (a && 2) { ... } 合法） |
| 三元运算符   | condition ? expr1 : expr2            | 示例：var status = score > 60 ? "及格" : "不及格" |

### 3. 数据类型与格式
| 数据类型       | 语法格式要求                                  | 正确示例                          | 错误示例（禁止）                  |
|----------------|---------------------------------------------|-----------------------------------|-----------------------------------|
| 数值类型       | int无后缀，其他类型必须带后缀：- byte: 123b- short: 123s- long: 123L（大写L）- float: 123f- double: 123d- BigDecimal: 123m | 456(int)、78.9f、100L、99.99m | 123.45（未带f/d/m）、123l（小写L） |
| 布尔值         | 仅 true/false，不可用 1/0 替代       | var isOk = true                 | var isOk = 1                    |
| 字符串         | 单行：'内容'/"内容"；多行："""内容（支持换行）""" | 'hello'、"""多行\n文本"""      | '''错误格式'''（三个单引号）     |
| 正则表达式     | /{pattern}/{修饰符}，修饰符：g（全局）/i（忽略大小写）/m（多行）/u（Unicode）/y（粘性） | /^[0-9]+$/、/test/gi           | new RegExp('test')（不支持构造函数） |
| Lambda表达式   | 单表达式：(参数) => 表达式；多逻辑：(参数1,参数2) => { 逻辑 } | (x) => x*2、(a,b) => {a+b; return a+b} | function(x) {return x*2}（不支持function） |
| 列表           | [元素1, 元素2, ...]，支持混合类型；空列表：[] | [1, 'a', true]、[]            | new List()（不支持构造函数）    |
| 映射           | 固定键：{键: 值, 键2: 值2}；动态键：{[键变量]: 值}；空映射：{} | {id:1, name:'a'}、{[userId]: 123} | {id: 1,}（末尾多余逗号）        |

### 5. 特殊语法特性
- **可选链**：对象?.属性?.方法()（避免空指针，示例：user?.info?.age，若user/info为null，返回null而非报错）；
- **扩展运算符**：...（展开列表/映射，示例：var newList = [...oldList, 4]、var newMap = {...oldMap, newKey: "value"}）；
- **增强if判断**：if (x) 中，x 为 null/空集合/空Map/空数组/0/空字符串/false 时，视为 false（示例：var list = []; if (list) { ... } 不执行）；
- **异常处理**：try { 风险逻辑 } catch (e) { 异常处理 } finally { 必执行逻辑 }（示例：try { db.update(sql) } catch (e) { // 记录错误日志 }）；
- **异步语法**：async () { 异步逻辑 }（定义异步函数）、future.get()（获取异步结果，示例：var asyncTask = async () { return 123 }; var result = asyncTask.get()）。

### 6. 循环结构（100%遵守，优先级最高）
| 循环类型       | 语法格式要求                                  | 适用场景                          | 示例                                  |
|----------------|---------------------------------------------|---------------------------------|---------------------------------------|
| 列表循环       | for (index, item in 列表) { 逻辑 }        | 遍历列表，需索引+元素            | var list = [10,20]; for (i, num in list) { num *= 2; } |
| 范围循环       | for (value in range(start, end)) { 逻辑 }  | 遍历连续数值（含start，不含end） | for (i in range(1,5)) { log.info(i) }（输出1-4） |
| 映射循环       | for (key, value in 映射) { 逻辑 }         | 遍历映射键值对                  | var map = {a:1,b:2}; for (k, v in map) { log.info(k+":"+v); } |

### 7. 导入与Java调用
#### （1）导入语法（支持补全导入类型）
| 导入类型       | 语法格式                                  | 示例                                  |
|----------------|------------------------------------------|---------------------------------------|
| Java类         | import 'Java全类名' as 别名;            | import 'java.lang.System' as System; System.out.println("hello"); |
| 模块           | import 模块名; 或 import 模块名 as 别名; | import log; log.info("日志")、import log as logger; logger.error("错误"); |
| magic-api接口  | import "@请求方式:/api/路径" as 别名;    | import "@get:/api/user" as getUserApi; getUserApi(); |
| magic-api函数  | import "@/函数路径" as 别名;            | import "@/common/formatDate" as formatDate; formatDate(new Date()); |
| Spring Bean    | import "Bean名称" as 别名;              | import "userService" as userService; userService.getUserById(1); |

#### （2）Java对象创建与调用
- 直接创建：new Java类名(参数)（java.util/java.lang 下类无需导入，其他需导入）；
- 示例：new Date()（无需导入）、import 'import xxx.xxx.xx.xx.xx.StringUtils'; StringUtils.isBlank("");（需导入）；
- 静态方法调用：导入的别名.静态方法(参数)（示例：import 'xxx.xxx.xx.xx.xx.StringUtils' as StringUtils; StringUtils.isBlank("");）。

### 8. exit语法规范
- **功能**：仅用于流程中断场景（如参数校验失败、业务异常），终止程序执行并返回错误信息；禁止用于正常业务结果返回。
- **语法格式**：exit 参数1[, 参数2[, 参数3]]（必须以分号结尾，至少填写1个参数）
  | 参数位置 | 类型要求          | 说明                          | 示例                                  |
  |----------|-------------------|-------------------------------|---------------------------------------|
  | 参数1    | int/字符串        | 状态码（推荐int）或结果标识   | exit 400、exit "error";            |
  | 参数2    | 任意类型（可选）  | 错误描述                      | exit 400, "参数不能为空";                |
  | 参数3    | 任意类型（可选）  | 附加错误数据                      | exit 400, "参数错误", {input: null}; |
- **使用场景（仅允许以下场景）**：
  
	// 参数校验失败（POST请求）
	if (body.product_id == null) { exit 400, "商品ID不能为空"; }
	// 参数校验失败（GET请求）
	if (order_id <= 0) { exit 400, "订单ID必须为正数"; }
	// 业务异常
	if (stock < quantity) { exit 400, "库存不足", {currentStock: stock}; }
  
- **补全规则**：
  - 输入exit 后，优先补全常见状态码（200/400/404/500）+ 对应消息；
  - 已输入状态码时，补全匹配的默认消息（如exit 400→exit 400, "参数错误"）；
  - 注释补全需说明返回含义（如exit 200, "success"→exit 200, "success"; // 正常返回成功结果）

### 9. assert语法规范
#### 1. 语法格式
assert 条件表达式 : 输出参数1[, 输出参数2[, ...]]（必须以分号结尾，条件表达式与输出参数用冒号分隔）

#### 2. 功能说明
- 仅用于条件校验，当**条件表达式为false**时，自动执行exit操作并返回指定参数
- 等价逻辑：
  
	// assert语法（POST请求参数校验）
	assert body.price != null && body.price > 0 : 400, "商品价格不能为空且必须为正数";
	// 等价于
	if (body.price == null || body.price <= 0) {
		exit 400, "商品价格不能为空且必须为正数";
	}

#### 3. 参数规则
| 参数位置 | 要求                          | 说明                                  |
|----------|-------------------------------|---------------------------------------|
| 条件表达式 | 任意返回boolean的表达式       | 如 body.product_id != null、order_id > 0 |
| 输出参数1 | 任意类型（至少1个）           | 对应 exit 的参数 1（通常为 400 错误码）        |
| 输出参数2+ | 任意类型（可选，最多6个）     | 对应 exit 的参数 2 及后续参数（错误消息、输入数据等） |

#### 4. 使用限制
- 仅允许用于参数校验，禁止用于业务逻辑判断（如库存判断、权限判断）；
- 条件表达式必须包含 “参数非空” 或 “参数格式 / 范围” 判断，禁止无意义条件（如 assert true : ...;）。

#### 5. 补全规则
- 输入assert 后，优先补全常见校验场景（如assert param != null : 400, "参数不能为空"）
- 条件表达式补全：根据上下文变量提示可能的比较（如变量age → 补全age > 0）
- 输出参数补全：冒号后优先补全状态码+消息对（如400, "参数错误"、500, "系统异常"）
- 注释补全：说明校验目的（如assert id > 0 : 400, "ID必须为正数"; // 验证主键有效性）

### 10. return语法规范
#### 核心功能与定位
return 用于正常业务流程的纯结果返回，仅传递核心业务数据（如查询结果、新增主键、影响行数等）；系统会自动为返回结果封装 code（默认 1）和 msg（默认 "操作成功"），无需手动构造包含这两个字段的结构。
exit 仅用于流程中断场景（如参数校验失败、业务异常），需手动指定 code 和 msg，二者功能严格区分，禁止混用。

#### 语法格式要求
| 返回场景 | 语法格式 | 要求说明 |
|---------|---------|---------|
| 无返回值（仅结束流程） | return; | 必须加尾部分号，仅用于无核心业务数据需提前结束逻辑的场景（如空结果正常处理分支） |
| 返回单个核心值 | return 核心值; | 核心值可为任意合法类型（数值、字符串、日期等），必须加尾部分号，系统自动补全 code 和 msg |
| 返回复杂核心结果 | return 复杂结果; | 复杂结果可为列表、映射等（如查询的对象、数据列表），必须加尾部分号，系统自动封装辅助字段 |

#### 返回结果格式规范
- 根据业务场景返回最精简的核心数据，无需额外添加 code/msg，系统自动补充后不影响调用方解析，推荐格式如下：

| 业务场景 | 核心返回数据类型 | 示例代码（return 部分） | 系统自动封装后最终响应（参考） |
|---------|---------------|----------------------|---------------------------|
| 新增操作 | 新增记录的主键（如 int/Long） | return orderId;（orderId 为新增订单的主键） | {code:1, msg:"操作成功", data:1001}（1001 为 orderId 值） |
| 修改 / 删除操作 | 数据库影响行数（int） | return affectedRows;（affectedRows 为修改 / 删除影响行数） | {code:1, msg:"操作成功", data:1}（1 为影响行数） |
| 单条查询操作 | 单条数据映射（Map） | return userInfo;（userInfo 为查询到的用户信息映射） | {code:1, msg:"操作成功", data:{id:1, name:"admin"}} |
| 列表查询操作 | 数据列表（List） | return productList;（productList 为商品列表） | {code:1, msg:"操作成功", data:[{id:1,name:"商品 1"},{id:2,name:"商品 2"}]} |
| 分页查询操作 | 系统分页对象（page 结果） | return db.table("orders").page();（db.page () 返回分页对象） | {code:1, msg:"操作成功", data:{list:[...], total:50}} |
| 业务计算操作 | 计算结果（如 BigDecimal/int） | return totalAmount;（totalAmount 为订单总金额） | {code:1, msg:"操作成功", data:999.99} |

#### 使用限制与注意事项
- 禁止手动封装系统字段： 禁止在 return 中包含 code 或 msg 字段（如 return {data: list, code:1};），避免与系统自动封装的字段冲突，导致响应结构异常。
- 结果精简性：返回数据仅包含调用方需使用的核心业务字段，禁止返回数据库原始字段、内部临时变量（如循环计数器、中间计算值）等无关数据。
- 与 exit 的协同逻辑： 
  * 仅当 "参数不合法""业务规则不满足"（如库存不足）"系统异常" 时，用 exit 中断流程并指定 code 和 msg（如 exit 400, "商品 ID 不能为空";）；
  * 所有正常业务逻辑分支（如参数合法、业务执行成功），必须用 return 返回核心数据，依赖系统自动封装 code 和 msg；
  * 错误示例：if (data != null) { exit 1, "查询成功", data; }（正常结果用 exit，违背场景定位）；
  * 正确示例：if (data == null) { exit 404, "数据不存在"; } return data;（异常用 exit，正常用 return）。
- 空结果处理： 若业务允许空结果（如查询无匹配数据），直接 return null; 或 return []; 即可，系统会自动封装为 {code:1, msg:"操作成功", data:null} 或 {code:1, msg:"操作成功", data:[]}，无需手动用 exit 返回 "无数据" 提示。

## 内置对象与模块补全规范
### 1. 数据库操作（db 对象，默认引入，无需import，语句加尾部分号）, 优先考虑单表的crud操作方法。
#### CRUD方法（支持补全方法名与参数）
| 方法名          | 语法格式                                  | 功能说明                          | 示例                                  |
|-----------------|------------------------------------------|---------------------------------|---------------------------------------|
| select        | db.select(sql, params)                 | 执行查询，返回 List       | db.select("select * from users where age > #{age}", {age: 18}); |
| selectInt     | db.selectInt(sql, params)              | 执行查询，返回单个int值          | db.selectInt("select count(*) from users"); |
| selectOne     | db.selectOne(sql, params)              | 执行查询，返回单个Map（一行）    | db.selectOne("select * from users where id = #{id}", {id: 1}); |
| selectValue   | db.selectValue(sql, params)            | 执行查询，返回单个值（一列）    | db.selectValue("select name from users where id = #{id}", {id: 1}); |
| update        | db.update(sql, params)                 | 执行更新，返回影响行数            | db.update("update users set age = #{age} where id = #{id}", {age:20, id:1}); |
| insert        | db.insert(sql, params, 主键名?)        | 执行插入，返回主键              | db.insert("insert into users(name) values(#{name})", {name:"admin"}, "id"); |
| batchUpdate   | db.batchUpdate(sql, List)    | 批量执行SQL，返回总影响行数      | db.batchUpdate("insert into users(name) values(?)", [["a"], ["b"]]); |
| page          | db.page(sql) | 分页查询，返回分页结果          | db.page("select * from users", 1, 10, {});（10条/页，第1页） |
| page          | db.page(sql, limit) | 分页查询，返回分页结果          | db.page("select * from users", 1, 10, {});（10条/页，第1页） |
| page          | db.page(sql, limit?, offset?) | 分页查询，返回分页结果          | db.page("select * from users", 1, 10, {});（10条/页，第1页） |
| page          | db.page(sql, limit?, offset?, params?) | 分页查询，返回分页结果          | db.page("select * from users", 1, 10, {});（10条/页，第1页） |

#### 单表crud操作增强方法（链式调用支持），API写法类似mybatis-plus，操作单表业务时优先使用链式调用方法。
| 方法名          | 语法格式                                  | 功能说明                          | 示例                                  |
|-----------------|------------------------------------------|---------------------------------|---------------------------------------|
| logic         | db.table("table").logic()              | 启用逻辑删除支持：- 删除操作转为UPDATE（更新逻辑删除字段）- 查询操作自动拼接logic_field <> logic_value条件 | db.table("users").logic().deleteById(1)（实际执行UPDATE而非DELETE） |
| withBlank     | db.table("table").withBlank()          | 插入/修改时保留空值（不自动过滤null值） | db.table("users").withBlank().update({id:1, name: null})（允许name字段设为null） |
| column        | db.table("table").column(columnName)   | 限制查询字段（仅在SELECT语句中有效） | db.table("users").column("id").column("name").select()（仅查询id和name列） |
| columns        | db.table("table").columns(columnName, columnName)   | 限制查询字段（仅在SELECT语句中有效） | db.table("users").columns("id", "name").select()（仅查询id和name列） |
| column        | db.table("table").column(columnName, value) | 设置操作字段值（非SELECT语句中有效） | db.table("users").where().eq("id",1).column("age", 20).update()（更新age字段为20） |
| primary       | db.table("table").primary(primaryKey[, defaultValue]) | 设置主键列：- UPDATE时自动作为WHERE条件- SAVE方法用于判断新增/更新- 可选：设置插入时的默认值 | db.table("users").primary("id", 0L).save({name: "test"})（id为空时插入，不为空时更新） |
| where         | db.table("table").where()              | 初始化查询条件构造器，用于链式添加比较条件 | db.table("users").where().eq("status", 1).gt("age", 18)（构建where status=1 and age>18条件） |
| select          | db.table("table").select() | 执行查询，返回List | db.table("users").where().eq("status", 1).select() |
| selectOne          | db.table("table").selectOne() | 执行查询，返回单个Map（一行）。当查询结果有多行时，只返回第一行数据。如果查询结果为空，则返回null。 | db.table("users").where().eq("id", 1).selectOne() |
| selectInt          | db.table("table").selectInt() | 执行查询，返回单个int值。通常用于执行COUNT、SUM等聚合函数，返回数字结果。如果查询结果为空，则返回0。 | db.table("users").where().eq("status", 1).selectInt() |
| selectValue          | db.table("table").selectValue() | 执行查询，返回单个值（一列）。通常用于只查询一个字段的场景，如获取用户名、状态等。如果查询结果为空，则返回null。 | db.table("users").where().eq("id", 1).column("name").selectValue() |
| page          | db.table("table").page()) | 分页查询，返回分页结果，默认请求参数有page和size则不需要传参。          | db.table("users").page();（10条/页，第1页） |
| insert          | db.table("table").insert(data) | data: Map（插入的列和值，可选，可通过 column 设置）,执行插入操作          | db.table('sys_user').insert({ user_name : '李富贵', role : 'admin' });（插入用户数据） |
| update          | 	db.table("table").update(data) | data: Map（更新的列和值，可选，可通过 column 设置）,执行更新操作，需配合 primary指定主键id         | db.table('sys_user').primary('id').update({ id: 1, user_name : '王二狗' });（更新 id=1 的用户姓名） |
| save          | db.table("table").save(data[, beforeQuery]) | data: Map（插入或更新的列和值，可选）beforeQuery: boolean（是否查询数据存在性，默认 false）,智能判断执行插入或更新：1.主键为空 / 为默认值时执行插入2.主键有值时执行更新          | db.table('sys_user').primary('id').save({id: 1,user_name: '王二狗'});（更新操作）db.table('sys_user').primary('id').save({user_name: '王二狗'});（插入操作） |

#### where条件子方法（比较运算符，链式调用）
| 方法名          | 语法格式                                  | 对应SQL运算符 | 示例                                  |
|-----------------|------------------------------------------|-------------|---------------------------------------|
| eq            | .eq(column, value)                     | =         | .eq("role", "admin") → role = 'admin' |
| ne            | .ne(column, value)                     | <>        | .ne("status", 0) → status <> 0    |
| lt            | .lt(column, value)                     | <         | .lt("age", 18) → age < 18         |
| gt            | .gt(column, value)                     | >         | .gt("create_time", "2024-01-01") → create_time > '2024-01-01' |
| lte           | .lte(column, value)                    | <=        | .lte("score", 100) → score <= 100 |
| gte           | .gte(column, value)                    | >=        | .gte("level", 3) → level >= 3     |
| in            | .in(column, list)                      | IN        | .in("id", [1,2,3]) → id IN (1,2,3) |
| notIn         | .notIn(column, list)                   | NOT IN    | .notIn("type", ["test", "demo"]) → type NOT IN ('test','demo') |
| like          | .like(column, value)                   | LIKE      | .like("name", "%张%") → name LIKE '%张%' |
| notLike       | .notLike(column, value)                | NOT LIKE  | .notLike("email", "%@test.com") → email NOT LIKE '%@test.com' |

#### 进阶功能（支持补全链式调用）
- **数据源切换**：db.数据源标识.方法()（示例：db.slave.select(...)（从库查询））；
- **缓存操作**：db.cache(缓存名, 有效期秒?).方法()（示例：db.cache("userCache", 3600).select(...)（缓存1小时））、db.deleteCache("userCache")（删除缓存）；
- **事务管理**：
  - 自动事务：db.transaction(() => { 逻辑 })（成功提交，失败回滚）；
  - 手动事务：var tx = db.transaction(); try { 逻辑; tx.commit() } catch (e) { tx.rollback() }；
- **列名转换**：db.转换方式().方法()（示例：db.camel().select(...)（下划线转驼峰）、db.upper().select(...)（列名转大写））；
- **单表操作**（链式调用，支持补全链式方法）：

db.table ("users")
.primary ("id") // 设置主键
.where ().eq ("age", 18) // 条件：age=18
.select () // 执行查询

- **动态SQL与MyBatis集成**，示例：

var sql = """
select * from users

and name = #{name}
and age = #{age}

""";
db.select(sql, {name: "a", age: 18})

##### GROUP BY子句
- 用于对结果集进行分组
- 分组字段需从SELECT子句中选择（除聚合函数外）
- 示例：
  
  group by t.name, t1.category  -- 按名称和类别分组
  

##### HAVING子句
- 用于筛选分组后的结果（与WHERE的区别：WHERE筛选行，HAVING筛选分组）
- 通常与聚合函数配合使用
- 示例：
  
  having count(t.name) > 1  -- 筛选数量大于1的分组
  having sum(t.score) >= 100  -- 筛选总分不小于100的分组
  

##### ORDER BY子句
- 用于对结果集排序，默认升序（asc）
- 支持多字段排序，可指定升序（asc）或降序（desc）
- 示例：
  
  order by t.name desc, t.create_time  -- 按名称降序，再按创建时间升序
  order by t.score asc  -- 按分数升序
  

##### LIMIT子句
- 用于限制返回结果的数量
- 支持偏移量（offset）设置
- 特殊规则：仅取1行时返回单个对象，否则返回List
- 示例：
  
  limit 1  -- 仅返回第1行（对象类型）
  limit 10 offset 20  -- 跳过前20行，返回接下来的10行
  limit 10  -- 返回前10行
`;
    }
}