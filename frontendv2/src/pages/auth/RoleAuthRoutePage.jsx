import { useLocation, useNavigate } from 'react-router-dom'
import RoleAuthDialog from '@/components/RoleAuthDialog.jsx'

export default function RoleAuthRoutePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const hasBackground = Boolean(location.state?.backgroundLocation)

  function handleClose() {
    if (hasBackground) {
      navigate(-1)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <RoleAuthDialog
      description="登录在这版里先作为方向切换器使用，用来观察不同角色进入主站后的布局、控件和数据展示。"
      onRequestClose={handleClose}
      standalone={!hasBackground}
      title="选择一个身份进入站点"
    />
  )
}
