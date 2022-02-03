import Link from 'next/link';

import styles from './exitPreview.module.scss';

export function ExitPreview() {
  return (
    <aside className={styles.exitButton}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}