import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "overview",
    "installation",
    {
      type: "category",
      label: "Message Template",
      items: [
        "message-template/text-message",
        "message-template/attachments",
        "message-template/embed-form-button",
      ],
    },
          {
            type: "category",
            label: "Tương tác",
            items: [
              "interaction/command",
              "interaction/component",
              "interaction/events",
              "interaction/onclick",
            ],
          },
          "events-list",
          "decorators",
          "examples",
  ],
};

export default sidebars;
