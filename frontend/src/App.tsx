import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Typography } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import EfficiencyDashboard from './pages/Dashboard/Efficiency'

const { Header, Content, Footer } = Layout
const { Title } = Typography

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <TrophyOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '12px' }} />
        <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: '64px' }}>
          研发团队效能看板
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Routes>
          <Route path="/dashboard/efficiency" element={<EfficiencyDashboard />} />
          <Route path="/" element={<Navigate to="/dashboard/efficiency" replace />} />
          <Route path="*" element={<Navigate to="/dashboard/efficiency" replace />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        研发效能平台 ©{new Date().getFullYear()} Created with ❤️
      </Footer>
    </Layout>
  )
}

export default App
