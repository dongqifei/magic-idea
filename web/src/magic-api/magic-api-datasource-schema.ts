import { IJSONSchema } from "@MagicIdea/core/common/json-schema";

export const DATASOURCE_SCHEMA: IJSONSchema = {
  type: 'object',
  required: ['name', 'key', 'url', 'username', 'password'],
  properties: {
    name: { 
      type: 'string', 
      title: '名称', 
      description: "数据源名称，仅做显示使用",
      maxLength: 50
    },
    key: { 
      type: 'string', 
      title: 'Key', 
      description: "数据源Key，后续代码中使用，支持字母、数字、下划线",
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$',
      maxLength: 50
    },
    url: { 
      type: 'string', 
      title: 'URL', 
      description: "数据库连接地址，如：jdbc:mysql://localhost:3306/magic",
      maxLength: 500
    },
    username: { 
      type: 'string', 
      title: '用户名', 
      description: "数据库用户名",
      maxLength: 50
    },
    password: { 
      type: 'string', 
      title: '密码', 
      description: "数据库密码",
      format: 'password',
      maxLength: 100
    },
    driverClassName: { 
      type: 'string', 
      title: '驱动类', 
      description: "数据库驱动类，可选，内部自动识别，也可以首选项中定义更多的数据库驱动类",
      enum: [
        "",
        "com.mysql.jdbc.Driver",
        "com.mysql.cj.jdbc.Driver",
        "oracle.jdbc.driver.OracleDriver",
        "org.postgresql.Driver",
        "com.microsoft.sqlserver.jdbc.SQLServerDriver",
        "com.ibm.db2.jcc.DB2Driver"
      ],
      default: ""
    },
    type: { 
      type: 'string', 
      title: '连接池类型', 
      description: "连接池类型，可选，也可以首选项中定义更多的连接池类型",
      enum: [
        "",
        "com.zaxxer.hikari.HikariDataSource",
        "com.alibaba.druid.pool.DruidDataSource",
        "org.apache.tomcat.jdbc.pool.DataSource",
        "org.apache.commons.dbcp2.BasicDataSource"
      ],
      default: ""
    },
    maxRows: { 
      type: 'number', 
      title: '最多返回条数', 
      description: "最多返回条数，-1为不限制",
      minimum: -1,
      default: -1
    },
    extraParams: { 
      type: 'string', 
      title: '其它配置', 
      description: "JSON格式的额外配置参数",
      format: 'json',
      default: "{}"
    },
  }
} as const;