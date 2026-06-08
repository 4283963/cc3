import React, { useMemo } from 'react'
import { Modal, List, Tag, Avatar, Typography, Space, Button } from 'antd'
import {
  WarningOutlined,
  UserOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { HighRiskAlert } from '../types'

const { Text, Paragraph } = Typography

interface HighRiskAlertModalProps {
  visible: boolean
  alerts: HighRiskAlert[]
  onClose: () => void
  onResolve?: (alertId: number) => void
}

const HighRiskAlertModal: React.FC<HighRiskAlertModalProps> = ({
  visible,
  alerts,
  onClose,
  onResolve,
}) => {
  const unresolvedAlerts = useMemo(
    () => alerts.filter((a) => !a.resolved),
    [alerts]
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'blue'
      default:
        return 'default'
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'idle_fish':
        return '摸鱼高危'
      case 'quality_degradation':
        return '质量劣化'
      default:
        return type
    }
  }

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleFilled style={{ color: '#ff4d4f', fontSize: '24px' }} />
          <span style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 'bold' }}>
            ⚠️ 高危预警
          </span>
          {unresolvedAlerts.length > 0 && (
            <Tag color="red" style={{ marginLeft: '8px' }}>
              {unresolvedAlerts.length} 条未处理
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={680}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      styles={{
        body: {
          backgroundColor: '#fff1f0',
          borderTop: '2px solid #ff4d4f',
        },
      }}
    >
      <List
        dataSource={unresolvedAlerts}
        locale={{ emptyText: '暂无高危预警' }}
        renderItem={(alert) => (
          <List.Item
            style={{
              marginBottom: '12px',
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              borderLeft: '4px solid #ff4d4f',
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.15)',
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  src={alert.user?.avatar_url}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#ff4d4f' }}
                />
              }
              title={
                <Space>
                  <Text strong style={{ fontSize: '16px' }}>
                    {alert.user?.display_name || `用户${alert.user_id}`}
                  </Text>
                  <Tag color={getSeverityColor(alert.severity)}>
                    {getAlertTypeLabel(alert.alert_type)}
                  </Tag>
                  {alert.penalty_points > 0 && (
                    <Tag color="red">
                      已扣 {alert.penalty_points} 分
                    </Tag>
                  )}
                </Space>
              }
              description={
                <div style={{ marginTop: '8px' }}>
                  <Paragraph type="danger" style={{ marginBottom: '8px' }}>
                    <WarningOutlined style={{ marginRight: '4px' }} />
                    {alert.title}
                  </Paragraph>
                  {alert.description && (
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {alert.description}
                    </Text>
                  )}
                  {alert.issue_keys && (
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        高危工单：
                      </Text>
                      {alert.issue_keys.split(',').map((key) => (
                        <Tag key={key} color="red" style={{ marginBottom: '4px' }}>
                          {key}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      检测时间：{dayjs(alert.detected_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                </div>
              }
            />
            {onResolve && (
              <Button size="small" type="primary" onClick={() => onResolve(alert.id)}>
                标记已处理
              </Button>
            )}
          </List.Item>
        )}
      />
    </Modal>
  )
}

export default HighRiskAlertModal
