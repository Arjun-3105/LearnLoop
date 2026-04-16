import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { LearnWorkspace } from '@/components/learn/LearnWorkspace';
import styles from './learn.module.css';

export default function LearnSession() {
  return (
    <>
      <Header title="Learning Session: React Hooks" />
      <div className={`page-scroll ${styles.learnLayout}`}>
        
        {/* Split Layout: 2 Columns Strict */}
        <div className={styles.splitGrid}>
          
          {/* LEFT PANEL: Concept Graph */}
          <div className={styles.leftPanel}>
            <Card padding="md" className={styles.graphContainer}>
              <div className={styles.graphHeader}>Concept Graph</div>
              
              <div className={styles.graphMock}>
                {/* Clean mock of a node structure */}
                <div className={styles.nodeItem}>
                  <div className={`${styles.nodeCircle} ${styles.completed}`}></div>
                  <span className={styles.nodeLabel}>Component Lifecycle</span>
                </div>
                
                <div className={styles.nodeConnector}></div>

                <div className={styles.nodeItem}>
                  <div className={`${styles.nodeCircle} ${styles.active}`}></div>
                  <span className={`${styles.nodeLabel} ${styles.labelActive}`}>useEffect Mechanics</span>
                </div>

                <div className={styles.nodeConnector}></div>

                <div className={styles.nodeItem}>
                  <div className={`${styles.nodeCircle} ${styles.locked}`}></div>
                  <span className={styles.nodeLabel}>Custom Hooks</span>
                </div>
              </div>

            </Card>
          </div>

          {/* RIGHT PANEL: Dynamic Workplace */}
          <div className={styles.rightPanel}>
            <LearnWorkspace 
                conceptTitle="useEffect Mechanics" 
                conceptDescription="The useEffect hook lets you synchronize a component with an external system. However, it runs after the render finishes."
            />
          </div>

        </div>

      </div>
    </>
  );
}
