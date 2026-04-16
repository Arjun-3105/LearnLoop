import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  return (
    <nav className={`brutal-border brutal-shadow ${styles.navbar}`}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoBox}>C</div>
          CogniAgent
        </Link>
      </div>

      <div className={styles.links}>
        <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
        <Link href="/learn" className={styles.navLink}>Learn</Link>
        <Link href="/history" className={styles.navLink}>History</Link>
        <Link href="/wallet" className={styles.navLink}>Wallet</Link>
      </div>

      <div className={styles.actions}>
        <Button variant="primary">Connect Wallet</Button>
      </div>
    </nav>
  );
};
