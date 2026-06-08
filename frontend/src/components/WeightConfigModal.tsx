import React, { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Button, Space, message } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import type { WeightConfig, WeightConfigUpdate } from '../../types'
import { weightsApi } from '../../api'

interface WeightConfigModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  currentWeights?: WeightConfig | null
}

const WeightConfigModal: React.FC<WeightConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  currentWeights,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && currentWeights) {
      form.setFieldsValue({
        code_line_weight: currentWeights.code_line_weight,
        bug_fix_weight: currentWeights.bug_fix_weight,
        story_point_weight: currentWeights.story_point_weight,
        sonar_bug_penalty: currentWeights.sonar_bug_penalty,
        code_smell_penalty: currentWeights.code_smell_penalty,
        vulnerability_penalty: currentWeights.vulnerability_penalty,
      })
    }
  }, [visible, currentWeights, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const updateData: WeightConfigUpdate = {
        code_line_weight: values.code_line_weight,
        bug_fix_weight: values.bug_fix_weight,
        story_point_weight: values.story_point_weight,
        sonar_bug_penalty: values.sonar_bug_penalty,
        code_smell_penalty: values.code_smell_penalty,
        vulnerability_penalty: values.vulnerability_penalty,
      }

      await weightsApi.updateWeights(updateData)
      await weightsApi.recalculate()

      message.success('权重配置保存成功，排名已重新计算')
      onSuccess()
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const formItemLayout = {
    labelCol: { span: 10 },
    wrapperCol: { span: 14 },
  }

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>绩效权重配置</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={520}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          保存并重算排名
        </Button>,
      ]}
    >
      <Form form={form} layout="horizontal" style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '16px', color: '#1890ff', fontWeight: 500 }}>
          🏆 加分项
        </div>
        <Form.Item
          {...formItemLayout}
          label="每1行代码贡献"
          name="code_line_weight"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="每修复1个Bug"
          name="bug_fix_weight"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="每1个故事点"
          name="story_point_weight"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>

        <div style={{ margin: '20px 0 16px', color: '#ff4d4f', fontWeight: 500 }}>
          ⚠️ 扣分项
        </div>
        <Form.Item
          {...formItemLayout}
          label="每个Sonar Bug"
          name="sonar_bug_penalty"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="每个代码异味"
          name="code_smell_penalty"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="每个安全漏洞"
          name="vulnerability_penalty"
          rules={[{ required: true, message: '请输入权重' }]}
        >
          <InputNumber min={0} step={0.5} precision={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default WeightConfigModal
