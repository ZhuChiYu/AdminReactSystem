import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '@/config';

// Swagger配置选项
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SoyBean Admin API',
      version: '1.0.0',
      description: 'SoyBean Admin 管理系统后端API文档',
      contact: {
        name: 'SoyBean Admin Team',
        email: 'admin@soybean.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: '开发环境',
      },
      {
        url: 'https://api.yourdomain.com',
        description: '生产环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌',
        },
      },
      schemas: {
        // 通用响应格式
        ApiResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              description: '状态码',
              example: 0,
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '操作成功',
            },
            data: {
              description: '响应数据',
            },
            timestamp: {
              type: 'number',
              description: '时间戳',
              example: 1672531200000,
            },
            path: {
              type: 'string',
              description: '请求路径',
              example: '/api/users',
            },
          },
        },
        // 分页响应格式
        PageResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              example: 0,
            },
            message: {
              type: 'string',
              example: '查询成功',
            },
            data: {
              type: 'object',
              properties: {
                records: {
                  type: 'array',
                  items: {},
                  description: '数据列表',
                },
                total: {
                  type: 'number',
                  description: '总记录数',
                  example: 100,
                },
                current: {
                  type: 'number',
                  description: '当前页码',
                  example: 1,
                },
                size: {
                  type: 'number',
                  description: '每页大小',
                  example: 10,
                },
                pages: {
                  type: 'number',
                  description: '总页数',
                  example: 10,
                },
              },
            },
            timestamp: {
              type: 'number',
              example: 1672531200000,
            },
            path: {
              type: 'string',
              example: '/api/users',
            },
          },
        },
        // 错误响应格式
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'number',
              description: '错误码',
              example: 1000,
            },
            message: {
              type: 'string',
              description: '错误消息',
              example: '参数错误',
            },
            data: {
              description: '错误详情',
              nullable: true,
            },
            timestamp: {
              type: 'number',
              example: 1672531200000,
            },
            path: {
              type: 'string',
              example: '/api/users',
            },
          },
        },
        // 用户信息
        UserInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: '用户ID',
              example: 1,
            },
            userName: {
              type: 'string',
              description: '用户名',
              example: 'admin',
            },
            nickName: {
              type: 'string',
              description: '昵称',
              example: '管理员',
            },
            email: {
              type: 'string',
              description: '邮箱',
              example: 'admin@soybean.com',
            },
            phone: {
              type: 'string',
              description: '手机号',
              example: '13800138000',
            },
            avatar: {
              type: 'string',
              description: '头像',
              example: 'https://example.com/avatar.jpg',
            },
            gender: {
              type: 'number',
              description: '性别 0-未知 1-男 2-女',
              example: 1,
            },
            department: {
              type: 'string',
              description: '部门',
              example: '管理部',
            },
            position: {
              type: 'string',
              description: '职位',
              example: '系统管理员',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '角色列表',
              example: ['super_admin'],
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: '权限列表',
              example: ['system:user:list'],
            },
          },
        },
        // 登录请求
        LoginRequest: {
          type: 'object',
          required: ['userName', 'password'],
          properties: {
            userName: {
              type: 'string',
              description: '用户名',
              example: 'admin',
            },
            password: {
              type: 'string',
              description: '密码',
              example: '123456',
            },
            captcha: {
              type: 'string',
              description: '验证码',
              example: 'abcd',
            },
          },
        },
        // 登录响应
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: '刷新令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            expires: {
              type: 'number',
              description: '过期时间戳',
              example: 1672531200000,
            },
            userInfo: {
              $ref: '#/components/schemas/UserInfo',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: '认证管理',
        description: '用户认证相关接口',
      },
      {
        name: '用户管理',
        description: '用户管理相关接口',
      },
      {
        name: '客户管理',
        description: '客户管理相关接口',
      },
      {
        name: '课程管理',
        description: '课程管理相关接口',
      },
      {
        name: '会议管理',
        description: '会议管理相关接口',
      },
      {
        name: '系统管理',
        description: '系统管理相关接口',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

// 生成API文档
const specs = swaggerJsdoc(options);

// 设置Swagger UI
export const setupSwagger = (app: Express): void => {
  // Swagger UI配置
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .scheme-container { background: #f7f7f7; }
    `,
    customSiteTitle: 'SoyBean Admin API文档',
  };

  // API文档路由
  app.use(config.apiDocPath, swaggerUi.serve);
  app.get(config.apiDocPath, swaggerUi.setup(specs, swaggerUiOptions));

  // JSON格式的API文档
  app.get(`${config.apiDocPath}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log(`📚 API文档地址: http://localhost:${config.port}${config.apiDocPath}`);
};
