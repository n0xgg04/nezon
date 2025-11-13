import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Nezon",
  tagline: "Xây bot Mezon nhanh chóng với NestJS",
  favicon: "img/mezon-logo-white.svg",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://nezon-docs.vercel.app/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "n0xgg04",
  projectName: "nezon",

  onBrokenLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/n0xgg04/nezon/tree/main/apps/docs",
          routeBasePath: "/docs",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Nezon",
      logo: {
        alt: "Nezon Logo",
        src: "img/mezon-logo-white.svg",
        href: "https://github.com/n0xgg04/nezon",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Tài liệu",
        },
        {
          href: "https://github.com/n0xgg04/nezon",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Tài liệu",
          items: [
            {
              label: "Giới thiệu",
              to: "/docs/",
            },
          ],
        },
        {
          title: "Kết nối",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/n0xgg04/nezon",
            },
            {
              label: "Mezon SDK",
              href: "https://github.com/mezonhq/mezon-sdk",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Nezon.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
