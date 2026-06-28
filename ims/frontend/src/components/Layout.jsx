import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import styles  from './Layout.module.css'

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} />
      <div className={styles.main}>
        <Topbar onToggle={() => setCollapsed(c => !c)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
