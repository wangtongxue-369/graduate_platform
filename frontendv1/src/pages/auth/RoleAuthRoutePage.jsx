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
      description="当前登录仅用于结构预览，点击身份后直接进入对应主站；退出时会回到游客门厅。"
      onRequestClose={handleClose}
      standalone={!hasBackground}
      title="选择你要进入的工作语境"
    />
  )
}
