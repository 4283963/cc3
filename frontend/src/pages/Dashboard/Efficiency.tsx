import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Tooltip,
} from 'antd'
import {
  TrophyOutlined,
  CodeOutlined,
  BugOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import WeightConfigModal from '../../components/WeightConfigModal'
import { efficiencyApi } from '../../api'
import type { UserEfficiency, EfficiencyRankingResponse } from '../../types'

const { Title } = Typography

const getRankIcon = (rank: number) => {
  if (rank === 1) {
    return <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
  }
  if (rank === 2) {
    return <span style={{ color: '#d9d9d9', fontWeight: 'bold', fontSize: '18px' }}>🥈</span>
  }
  if (rank === 3) {
    return <span style={{ color: '#d46b08', fontWeight: 'bold', fontSize: '18px' }}>🥉</span>
  }
  return <span style={{ color: '#8c8c8c', fontWeight: 500 }}>#{rank}</span>
}

const getScoreColor = (score: number, maxScore: number) => {
  const ratio = score / maxScore
  if (ratio >= 0.8) return '#52c41a'
  if (ratio >= 0.5) return '#faad14'
  if (ratio >= 0.3) return '#fa8c16'
  return '#ff4d4f'
}

const EfficiencyDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EfficiencyRankingResponse | null>(null)
  const [weightModalVisible, setWeightModalVisible] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await efficiencyApi.getRankings()
      setData(result)
    } catch (error) {
      message.error('获取排行数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const maxScore = useMemo(() => {
    if (!data?.rankings?.length) return 0
    return Math.max(...data.rankings.map((item) => item.total_score))
  }, [data])

  const stats = useMemo(() => {
    if (!data?.rankings?.length) {
      return {
        totalMembers: 0,
        totalLines: 0,
        totalBugsFixed: 0,
        avgBugRate: 0,
      }
    }
    const rankings = data.rankings
    return {
      totalMembers: rankings.length,
      totalLines: rankings.reduce((sum, item) => sum + item.total_lines, 0),
      totalBugsFixed: rankings.reduce((sum, item) => sum + item.bugs_fixed, 0),
      avgBugRate: (
        rankings.reduce((sum, item) => sum + item.bug_rate, 0) / rankings.length
      ).toFixed(2),
    }
  }, [data])

  const columns: ColumnsType<UserEfficiency> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (rank: number) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>{getRankIcon(rank)}</div>
      ),
    },
    {
      title: '成员',
      dataIndex: 'display_name',
      key: 'member',
      width: 180,
      render: (name: string, record) => (
        <Space>
          <Avatar
            size={36}
            src={record.avatar_url}
            style={{ backgroundColor: '#1890ff' }}
          >
            {name?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.department}</div>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <Tooltip title="代码贡献总行数（增+删）">
          <Space>
            <CodeOutlined />
            代码行数
          </Space>
        </Tooltip>
      ),
      dataIndex: 'total_lines',
      key: 'total_lines',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.total_lines - b.total_lines,
      render: (val: number) => <span style={{ color: '#1890ff' }}>{val.toLocaleString()}</span>,
    },
    {
      title: (
        <Tooltip title="已修复的 Bug 数量">
          <Space>
            <BugOutlined />
            修复Bug
          </Space>
        </Tooltip>
      ),
      dataIndex: 'bugs_fixed',
      key: 'bugs_fixed',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.bugs_fixed - b.bugs_fixed,
      render: (val: number) => <Tag color="green">{val} 个</Tag>,
    },
    {
      title: '故事点',
      dataIndex: 'story_points',
      key: 'story_points',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.story_points - b.story_points,
      render: (val: number) => <span style={{ color: '#722ed1' }}>{val} pts</span>,
    },
    {
      title: (
        <Tooltip title="未修复的 Sonar Bug 数量">
          <Space>
            <FallOutlined />
            Sonar Bug
          </Space>
        </Tooltip>
      ),
      dataIndex: 'sonar_bugs',
      key: 'sonar_bugs',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.sonar_bugs - b.sonar_bugs,
      render: (val: number) => (
        <Tag color={val > 5 ? 'red' : val > 2 ? 'orange' : 'green'}>{val} 个</Tag>
      ),
    },
    {
      title: (
        <Tooltip title="每千行代码的 Bug 数">
          <Space>
            <ThunderboltOutlined />
            Bug率
          </Space>
        </Tooltip>
      ),
      dataIndex: 'bug_rate',
      key: 'bug_rate',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.bug_rate - b.bug_rate,
      render: (val: number) => (
        <span style={{ color: val > 10 ? '#ff4d4f' : val > 5 ? '#faad14' : '#52c41a' }}>
          {val} ‰
        </span>
      ),
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 120,
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.total_score - b.total_score,
      render: (val: number) => (
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: getScoreColor(val, maxScore),
          }}
        >
          {val.toFixed(1)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <TrophyOutlined style={{ color: '#faad14' }} /> 团队卷王看板
        </Title>
        <Space>
          <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
            数据更新于: {data ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : '--'}
          </span>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => setWeightModalVisible(true)}
          >
            权重配置
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队总人数"
              value={stats.totalMembers}
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="代码总贡献"
              value={stats.totalLines}
              prefix={<CodeOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="行"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="修复Bug总数"
              value={stats.totalBugsFixed}
              prefix={<BugOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均Bug率"
              value={Number(stats.avgBugRate)}
              prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix="‰"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>团队绩效排名</span>
          </Space>
        }
        extra={<Tag color="blue">近30天数据</Tag>}
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data?.rankings || []}
            rowKey="user_id"
            pagination={false}
            size="middle"
          />
        </Spin>
      </Card>

      <WeightConfigModal
        visible={weightModalVisible}
        onCancel={() => setWeightModalVisible(false)}
        onSuccess={() => {
          setWeightModalVisible(false)
          fetchData()
        }}
        currentWeights={data?.weights || null}
      />
    </div>
  )
}

export default EfficiencyDashboard
