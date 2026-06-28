import { useParams } from 'react-router-dom'
import styles from './PlaceholderPage.module.css'

const PAGE_NAMES = {
  timetable:         'My Time Table',
  subjects:          'My Subject Registration',
  leave:             'Apply Leave / OD',
  attendance:        'Attendance',
  certificates:      'Apply Certificates',
  cat:               'CAT Mark',
  lab:               'LAB Mark',
  'assignment-mark': 'Assignment Mark',
  grades:            'Grade Book',
  fee:               'Academic Fee',
  feedback:          'Feedbacks',
  committee:         'Class Committee',
  nodue:             'No Due Request',
  messages:          'Messages',
  password:          'Change Password',
}

export default function PlaceholderPage() {
  const { name } = useParams()
  const title    = PAGE_NAMES[name] || name

  return (
    <div>
      <div className={styles.welcomeBar}>
        <h2>{title}</h2>
        <p className={styles.breadcrumb}>Dashboard › {title}</p>
      </div>
      <div className={styles.box}>
        <div className={styles.icon}>🚧</div>
        <h3>Feature Coming Soon</h3>
        <p>This module will be available in the next update.</p>
      </div>
    </div>
  )
}
