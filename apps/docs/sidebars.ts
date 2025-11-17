import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "overview",
    "installation",
    {
      type: "doc",
      id: "guides/data-access",
      label: "Bot Context",
    },
    {
      type: "category",
      label: "Xử lý logic & Event",
      items: [
        "guides/logic-events",
        "interaction/command",
        "interaction/component",
        "interaction/onclick",
        "interaction/events",
        "events-list",
      ],
    },
    {
      type: "category",
      label: "Message Builder",
      items: [
        "message-template/overview",
        "message-template/smart-message",
        "message-template/text-message",
        "message-template/attachments",
        "message-template/embed-form-button",
      ],
    },
    "messaging/send-message",
    {
      type: "category",
      label: "Utility",
      items: ["nezon/utils"],
    },
    "examples",
    "decorators",
  ],
};

export default sidebars;
