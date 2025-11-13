import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  illustration: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Decorator-first",
    illustration: "undraw_docusaurus_tree.svg",
    description: (
      <>
        Khai báo command, component và event thông qua decorator quen thuộc của
        NestJS. Nezon tự động khám phá, đăng ký và inject tham số typed từ
        mezon-sdk cho bạn.
      </>
    ),
  },
  {
    title: "Lifecycle tự động",
    illustration: "undraw_docusaurus_mountain.svg",
    description: (
      <>
        `NezonLifecycleService` đăng nhập bot khi ứng dụng khởi động, bind
        listener và dọn dẹp khi shutdown. Không cần tự viết boilerplate kết nối
        với Mezon.
      </>
    ),
  },
  {
    title: "Caching thông minh",
    illustration: "undraw_docusaurus_react.svg",
    description: (
      <>
        Channel, clan, user và message được cache theo từng lượt xử lý, giúp hạn
        chế gọi API lặp lại và tối ưu độ trễ.
      </>
    ),
  },
];

function Feature({ title, illustration, description }: FeatureItem) {
  const Svg = require(`@site/static/img/${illustration}`).default;
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
