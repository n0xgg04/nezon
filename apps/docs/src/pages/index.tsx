import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/">
            Bắt đầu với Nezon
          </Link>
          <Link
            className="button button--outline button--lg margin-left--md"
            to="https://github.com/n0xgg04/nezon"
          >
            Xem mã nguồn
          </Link>
        </div>
      </div>
    </header>
  );
}

function LandingHighlights() {
  return (
    <section className="container margin-vert--lg">
      <div className="row">
        <div className="col col--6">
          <h2>Bot Mezon chỉ sau vài decorator</h2>
          <p>
            Nezon mở rộng NestJS với các decorator command, component và event,
            tự động hoá việc đăng nhập client, bind listener và quản lý cache để
            bạn tập trung vào trải nghiệm người dùng.
          </p>
        </div>
        <div className="col col--6">
          <h2>Tích hợp mượt với hệ sinh thái NestJS</h2>
          <p>
            Kết hợp với module cấu hình, dependency injection và lifecycle hook
            sẵn có của NestJS để triển khai bot theo kiến trúc server-side quen
            thuộc.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Tài liệu Nezon - thư viện NestJS xây dựng bot cho Mezon"
    >
      <HomepageHeader />
      <main>
        <LandingHighlights />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
