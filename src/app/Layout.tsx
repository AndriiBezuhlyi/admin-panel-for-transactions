import { NavLink, Outlet, Link } from 'react-router-dom'
import { Result, Button } from 'antd'
import styles from './Layout.module.css'
export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/dashboard">
          Finance Panel
        </Link>
        <nav aria-label="Основна навігація">
          <NavLink to="/dashboard">Огляд</NavLink>
          <NavLink to="/transactions">Транзакції</NavLink>
          <NavLink to="/exchange-rates">Курси валют</NavLink>
          <NavLink to="/converter">Конвертер</NavLink>
        </nav>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
export function RouteError() {
  return (
    <Result
      status="error"
      title="Не вдалося відкрити сторінку"
      subTitle="Спробуйте оновити сторінку або поверніться до огляду."
      extra={
        <Button onClick={() => window.location.assign('/dashboard')}>
          До огляду
        </Button>
      }
    />
  )
}
