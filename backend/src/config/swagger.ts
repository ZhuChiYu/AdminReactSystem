import type { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from '@/config';

// Swagger配置选项
const options: swaggerJsdoc.Options = {
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
  definition: {
    components: {
      schemas: {
        // 通用响应格式
        ApiResponse: {
          properties: {
            code: {
              description: '状态码',
              example: 0,
              type: 'number'
            },
            data: {
              description: '响应数据'
            },
            message: {
              description: '响应消息',
              example: '操作成功',
              type: 'string'
            },
            path: {
              description: '请求路径',
              example: '/api/users',
              type: 'string'
            },
            timestamp: {
              description: '时间戳',
              example: 1672531200000,
              type: 'number'
            }
          },
          type: 'object'
        },
        // 错误响应格式
        ErrorResponse: {
          properties: {
            code: {
              description: '错误码',
              example: 1000,
              type: 'number'
            },
            data: {
              description: '错误详情',
              nullable: true
            },
            message: {
              description: '错误消息',
              example: '参数错误',
              type: 'string'
            },
            path: {
              example: '/api/users',
              type: 'string'
            },
            timestamp: {
              example: 1672531200000,
              type: 'number'
            }
          },
          type: 'object'
        },
        // 登录请求
        LoginRequest: {
          properties: {
            captcha: {
              description: '验证码',
              example: 'abcd',
              type: 'string'
            },
            password: {
              description: '密码',
              example: '123456',
              type: 'string'
            },
            userName: {
              description: '用户名',
              example: 'admin',
              type: 'string'
            }
          },
          required: ['userName', 'password'],
          type: 'object'
        },
        // 登录响应
        LoginResponse: {
          properties: {
            expires: {
              description: '过期时间戳',
              example: 1672531200000,
              type: 'number'
            },
            refreshToken: {
              description: '刷新令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              type: 'string'
            },
            token: {
              description: 'JWT令牌',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              type: 'string'
            },
            userInfo: {
              $ref: '#/components/schemas/UserInfo'
            }
          },
          type: 'object'
        },
        // 分页响应格式
        PageResponse: {
          properties: {
            code: {
              example: 0,
              type: 'number'
            },
            data: {
              properties: {
                current: {
                  description: '当前页码',
                  example: 1,
                  type: 'number'
                },
                pages: {
                  description: '总页数',
                  example: 10,
                  type: 'number'
                },
                records: {
                  description: '数据列表',
                  items: {},
                  type: 'array'
                },
                size: {
                  description: '每页大小',
                  example: 10,
                  type: 'number'
                },
                total: {
                  description: '总记录数',
                  example: 100,
                  type: 'number'
                }
              },
              type: 'object'
            },
            message: {
              example: '查询成功',
              type: 'string'
            },
            path: {
              example: '/api/users',
              type: 'string'
            },
            timestamp: {
              example: 1672531200000,
              type: 'number'
            }
          },
          type: 'object'
        },
        // 用户信息
        UserInfo: {
          properties: {
            avatar: {
              description: '头像',
              example: 'https://example.com/avatar.jpg',
              type: 'string'
            },
            department: {
              description: '部门',
              example: '管理部',
              type: 'string'
            },
            email: {
              description: '邮箱',
              example: 'admin@soybean.com',
              type: 'string'
            },
            gender: {
              description: '性别 0-未知 1-男 2-女',
              example: 1,
              type: 'number'
            },
            id: {
              description: '用户ID',
              example: 1,
              type: 'number'
            },
            nickName: {
              description: '昵称',
              example: '管理员',
              type: 'string'
            },
            permissions: {
              description: '权限列表',
              example: ['system:user:list'],
              items: {
                type: 'string'
              },
              type: 'array'
            },
            phone: {
              description: '手机号',
              example: '13800138000',
              type: 'string'
            },
            position: {
              description: '职位',
              example: '系统管理员',
              type: 'string'
            },
            roles: {
              description: '角色列表',
              example: ['super_admin'],
              items: {
                type: 'string'
              },
              type: 'array'
            },
            userName: {
              description: '用户名',
              example: 'admin',
              type: 'string'
            }
          },
          type: 'object'
        }
      },
      securitySchemes: {
        bearerAuth: {
          bearerFormat: 'JWT',
          description: 'JWT认证令牌',
          scheme: 'bearer',
          type: 'http'
        }
      }
    },
    info: {
      contact: {
        email: 'admin@soybean.com',
        name: 'SoyBean Admin Team'
      },
      description: 'SoyBean Admin 管理系统后端API文档',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      title: 'SoyBean Admin API',
      version: '1.0.0'
    },
    openapi: '3.0.0',
    security: [
      {
        bearerAuth: []
      }
    ],
    servers: [
      {
        description: '开发环境',
        url: `http://localhost:${config.port}`
      },
      {
        description: '生产环境',
        url: 'https://api.yourdomain.com'
      }
    ],
    tags: [
      {
        description: '用户认证相关接口',
        name: '认证管理'
      },
      {
        description: '用户管理相关接口',
        name: '用户管理'
      },
      {
        description: '客户管理相关接口',
        name: '客户管理'
      },
      {
        description: '课程管理相关接口',
        name: '课程管理'
      },
      {
        description: '会议管理相关接口',
        name: '会议管理'
      },
      {
        description: '系统管理相关接口',
        name: '系统管理'
      }
    ]
  }
};

// 生成API文档
const specs = swaggerJsdoc(options);

// 设置Swagger UI
export const setupSwagger = (app: Express): void => {
  // Swagger UI配置
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .scheme-container { background: #f7f7f7; }
    `,
    customSiteTitle: 'SoyBean Admin API文档',
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  };

  // API文档路由
  app.use(config.apiDocPath, swaggerUi.serve);
  app.get(config.apiDocPath, swaggerUi.setup(specs, swaggerUiOptions));

  // JSON格式的API文档
  app.get(`${config.apiDocPath}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};
