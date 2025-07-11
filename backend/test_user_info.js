const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGetUserInfo() {
  const user = await prisma.user.findUnique({
    include: {
      department: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    },
    where: { id: 1 }
  });

  if (!user) {
    return;
  }

  // 提取角色和权限
  const roles = user.userRoles.map(ur => ur.role.roleCode);
  const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code));

  const userInfo = {
    avatar: user.avatar,
    buttons: permissions,
    department: user.department?.name || '',
    email: user.email,
    gender: user.gender,
    nickName: user.nickName,
    permissions,
    phone: user.phone,
    position: user.position || '',
    roles,
    userId: user.id.toString(),
    userName: user.userName
  };

  await prisma.$disconnect();
}

testGetUserInfo().catch(console.error);
