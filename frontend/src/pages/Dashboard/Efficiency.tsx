import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  Select,
  Progress,
  Empty,
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
  BarChartOutlined,
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
  const [timeRange, setTimeRange] = useState<string>('30d')

  const timeRangeOptions = [
    { value: '7d', label: '近 7 天' },
    { value: '30d', label: '近 30 天' },
    { value: '90d', label: '近 90 天' },
    { value: '6m', label: '近 6 个月' },
    { value: '1y', label: '近 1 年' },
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await efficiencyApi.getRankings({ time_range: timeRange })
      setData(result)
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail || error?.message || '获取排行数据失败'
      message.error(errMsg)
      console.error(error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxScore = useMemo(() => {
    if (!data?.rankings?.length) return 0
    return Math.max(...data.rankings.map((item) => item.total_score))
  }, [data])

  const rankingsList = useMemo(() => {
    if (!data || !Array.isArray(data.rankings)) {
      return []
    }
    return data.rankings
  }, [data])

  const stats = useMemo(() => {
    if (!rankingsList.length) {
      return {
        totalMembers: 0,
        totalLines: 0,
        totalBugsFixed: 0,
        avgBugRate: 0,
      }
    }
    return {
      totalMembers: rankingsList.length,
      totalLines: rankingsList.reduce((sum, item) => sum + item.total_lines, 0),
      totalBugsFixed: rankingsList.reduce((sum, item) => sum + item.bugs_fixed, 0),
      avgBugRate: (
        rankingsList.reduce((sum, item) => sum + item.bug_rate, 0) / rankingsList.length
      ).toFixed(2),
    }
  }, [rankingsList])

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

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
  }

  const getTimeRangeLabel = (value: string) => {
    const option = timeRangeOptions.find((o) => o.value === value)
    return option?.label || value
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <TrophyOutlined style={{ color: '#faad14' }} /> 团队卷王看板
        </Title>
        <Space wrap>
          <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
            数据更新于: {data ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss') : '--'}
          </span>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 140 }}
            options={timeRangeOptions}
          />
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
            <BarChartOutlined style={{ color: '#1890ff' }} />
            <span>团队绩效得分排行</span>
          </Space>
        }
        extra={<Tag color="blue">{getTimeRangeLabel(timeRange)}</Tag>}
        style={{ marginBottom: '24px' }}
      >
        <Spin spinning={loading}>
          {rankingsList.length > 0 ? (
            <div style={{ padding: '12px 0' }}>
              {rankingsList.slice(0, 10).map((item) => (
                <div
                  key={item.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ width: '40px', textAlign: 'center' }}>
                    {getRankIcon(item.rank)}
                  </div>
                  <Avatar
                    size={32}
                    src={item.avatar_url}
                    style={{ marginRight: '12px', backgroundColor: '#1890ff' }}
                  >
                    {item.display_name?.charAt(0)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{item.display_name}</span>
                      <span
                        style={{
                          color: getScoreColor(item.total_score, maxScore),
                          fontWeight: 'bold',
                        }}
                      >
                        {item.total_score.toFixed(1)} 分
                      </span>
                    </div>
                    <Progress
                      percent={maxScore > 0 ? (item.total_score / maxScore) * 100 : 0}
                      showInfo={false}
                      strokeColor={getScoreColor(item.total_score, maxScore)}
                      size="small"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无数据，请调整时间范围或等待数据同步" />
          )}
        </Spin>
      </Card>

      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>团队绩效排名</span>
          </Space>
        }
        extra={<Tag color="blue">{getTimeRangeLabel(timeRange)}</Tag>}
      >
        <Spin spinning={loading}>
          {rankingsList.length > 0 ? (
            <Table
              columns={columns}
              dataSource={rankingsList}
              rowKey="user_id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无排名数据" />
          )}
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
