import { Link, NavLink } from 'react-router-dom'

export default function AdminNav() {
  return (
    <aside>
      <div className="activity">SITCON 2026</div>
      <div className="title">管理後台</div>
      <nav>
        <ul>
          <li><NavLink to="/admin" end>總覽</NavLink></li>
          <li><NavLink to="/admin/tickets">票種管理</NavLink></li>
          <li><NavLink to="/admin/forms">表單管理</NavLink></li>
          <li><NavLink to="/admin/invites">邀請碼管理</NavLink></li>
          <li><NavLink to="/admin/registrations">報名資料</NavLink></li>
          <li><NavLink to="/admin/intro">編輯說明</NavLink></li>
        </ul>
      </nav>
      <div className="links">
        <div className="user">管理者</div>
        <div className="logout"><Link to="/">回到首頁</Link></div>
        <div className="logout"><a href="#">繁</a>・<a href="#">简</a>・<a href="#">EN</a></div>
      </div>
    </aside>
  )
}
