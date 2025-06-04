import { useRoute } from '@/features/router';

const Component = () => {
  const { params } = useRoute<null, null, { slug: string[] }>();

  // 解析URL参数：roleId, roleName, status
  const [roleId, roleName, status] = params?.slug || [];

  const getRoleStatusText = (statusValue: string) => {
    if (statusValue === '1') return '启用';
    if (statusValue === '2') return '禁用';
    return '未知';
  };

  const getRoleStatusColor = (statusValue: string) => {
    if (statusValue === '1') return '#52c41a';
    if (statusValue === '2') return '#ff4d4f';
    return '#d9d9d9';
  };

  return (
    <ACard
      className="h-full"
      extra={<AButton onClick={() => window.history.back()}>返回</AButton>}
      title={`角色详情 - ${roleName || '未知角色'}`}
    >
      <div className="space-y-4">
        <ADescriptions
          bordered
          column={2}
          size="middle"
          title="基本信息"
          items={[
            {
              children: roleId || '未知',
              key: 'roleId',
              label: '角色ID'
            },
            {
              children: roleName || '未知',
              key: 'roleName',
              label: '角色名称'
            },
            {
              children: <ATag color={getRoleStatusColor(status)}>{getRoleStatusText(status)}</ATag>,
              key: 'status',
              label: '角色状态'
            },
            {
              children: roleId === '2' ? '系统超级管理员，拥有所有权限' : '暂无描述',
              key: 'description',
              label: '角色描述',
              span: 2
            }
          ]}
        />

        {roleId === '2' && (
          <ACard
            size="small"
            style={{ backgroundColor: '#fff2e8', borderColor: '#ffbb96' }}
            title="特殊说明"
          >
            <div className="text-orange-600">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">⚠️ 超级管理员角色</span>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>此角色拥有系统的最高权限</li>
                <li>不允许删除此角色</li>
                <li>具有所有功能模块的访问权限</li>
                <li>可以管理其他所有角色和用户</li>
              </ul>
            </div>
          </ACard>
        )}

        <ACard
          size="small"
          title="操作记录"
        >
          <AEmpty description="暂无操作记录" />
        </ACard>
      </div>
    </ACard>
  );
};

export default Component;
