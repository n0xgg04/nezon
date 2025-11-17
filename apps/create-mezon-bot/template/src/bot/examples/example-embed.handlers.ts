import { Injectable } from "@nestjs/common";
import {
  Args,
  AutoContext,
  ButtonBuilder,
  ButtonStyle,
  Command,
  EmbedBuilder,
  NezonUtils,
  SmartMessage,
} from "@n0xgg04/nezon";
import type { Nezon, NezonUtilsService } from "@n0xgg04/nezon";

@Injectable()
export class ExampleEmbedHandlers {
  @Command("image")
  async onImageDemo(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    const imageUrl = args[0] || "https://picsum.photos/800/600";
    await managedMessage.reply(
      SmartMessage.text("Here are some example images!")
        .addImage(imageUrl, {
          filename: "example1.jpg",
          width: 800,
          height: 600,
        })
        .addImage("https://picsum.photos/400/300", {
          filename: "example2.jpg",
          width: 400,
          height: 300,
        })
        .addButton(
          new ButtonBuilder()
            .setCustomId("/demo/success/static")
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Link)
        )
    );
  }

  @Command("embed")
  async onEmbedDemo(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.text("").addEmbed(
        new EmbedBuilder()
          .setColor("#abcdef")
          .setTitle("Example Embed Title")
          .setThumbnail("https://example.com/example-thumbnail.jpg")
          .addField("Field 1", "Value 1", true)
          .addField("Field 2", "Value 2", true)
          .addField("Field 3", "Value 3", true)
          .setImage("https://example.com/example-image.jpg")
          .setFooter("Example footer text")
      )
    );
  }

  @Command("form")
  async onFormDemo(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.build()
        .addEmbed(
          new EmbedBuilder()
            .setColor("#E91E63")
            .setTitle("POLL CREATOR")
            .addTextField("Title", "title", {
              placeholder: "Input title here",
              defaultValue: "",
            })
            .addTextField("Option 1️⃣", "option_1", {
              placeholder: "Input option 1 here",
              defaultValue: "",
            })
            .addTextField("Option 2️⃣", "option_2", {
              placeholder: "Input option 2 here",
              defaultValue: "",
            })
            .addSelectField(
              "Type",
              "type",
              [
                { label: "Single choice", value: "SINGLE" },
                { label: "Multiple choice", value: "MULTIPLE" },
              ],
              "SINGLE"
            )
            .addTextField(
              "Expired Time (hour) - Default: 168 hours (7 days)",
              "expired",
              {
                placeholder: "Input expired time here",
                defaultValue: 168,
                isNumber: true,
              }
            )
            .setTimestamp()
            .setFooter(
              "Powered by Mezon",
              "https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp"
            )
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/poll/cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/poll/add-option")
            .setLabel("Add Option")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/poll/create")
            .setLabel("Create")
            .setStyle(ButtonStyle.Success)
        )
    );
  }

  @Command("quiz")
  async onQuiz(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const choices = [
      "business strategy, human resource practices, organisational capabilities",
      "marketing strategy, human resource practices, organisational capabilities",
      "business strategy, human resource practices, organisational structure",
      "marketing strategy, human resource practices, organisational structure",
      "to supervise",
      "to stimulate",
      "to motivate",
      "all of the above",
    ];
    await managedMessage.reply(
      SmartMessage.build()
        .addEmbed(
          new EmbedBuilder()
            .setColor("#E91E63")
            .setTitle("[SPECIALIZED] The basic managerial skill(s) is(are)")
            .setDescriptionMarkdown(
              choices.map((choice, idx) => `${idx + 1} - ${choice}`),
              { after: "(Chọn đáp án đúng tương ứng phía bên dưới!)" }
            )
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/1")
            .setLabel("1")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/2")
            .setLabel("2")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/3")
            .setLabel("3")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/4")
            .setLabel("4")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/5")
            .setLabel("5")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/6")
            .setLabel("6")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/7")
            .setLabel("7")
            .setStyle(ButtonStyle.Primary)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/quiz/answer/8")
            .setLabel("8")
            .setStyle(ButtonStyle.Primary)
        )
    );
  }

  @Command("slots")
  async onSlots(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @NezonUtils() utils: NezonUtilsService
  ) {
    const pool = [
      [
        "1.png",
        "2.png",
        "3.png",
        "4.png",
        "5.png",
        "6.png",
        "7.png",
        "8.png",
        "9.png",
        "10.png",
        "11.png",
        "12.png",
        "13.png",
        "14.png",
        "15.png",
        "10.png",
      ],
      [
        "1.png",
        "2.png",
        "3.png",
        "4.png",
        "5.png",
        "6.png",
        "7.png",
        "8.png",
        "9.png",
        "10.png",
        "11.png",
        "12.png",
        "13.png",
        "14.png",
        "15.png",
        "12.png",
      ],
      [
        "1.png",
        "2.png",
        "3.png",
        "4.png",
        "5.png",
        "6.png",
        "7.png",
        "8.png",
        "9.png",
        "10.png",
        "11.png",
        "12.png",
        "13.png",
        "14.png",
        "15.png",
        "3.png",
      ],
    ];
    const description = [
      "",
      "Jackpot: 1.337.517đ",
      "Bạn đã cược: 5.000đ",
      "Bạn thua: 5.000đ",
      "Jackpot mới: 1.342.017đ",
      "",
    ].join("\n");
    const animationAck = await managedMessage.reply(
      SmartMessage.text("").addEmbed(
        new EmbedBuilder()
          .setColor("#1F8B4C")
          .setTitle("🎰 Kết quả Slots 🎰")
          .setDescription(description)
          .addAnimatedImage({
            id: "slots",
            imageUrl:
              "https://cdn.mezon.ai/0/1834156727516270592/1805415525119955000/1751356942745_1slots.png",
            positionUrl:
              "https://cdn.mezon.ai/0/1834156727516270592/1827994776956309500/1751357108975_slots.json",
            pool,
            repeat: 3,
            duration: 0.35,
          })
      )
    );

    if (!animationAck?.message_id || !animationAck?.channel_id) {
      return;
    }

    setTimeout(async () => {
      const animatedMessage = await utils.getManagedMessage(
        animationAck.message_id,
        animationAck.channel_id
      );
      if (!animatedMessage) {
        return;
      }
      await animatedMessage.update(
        SmartMessage.text("").addEmbed(
          new EmbedBuilder()
            .setColor("#1F8B4C")
            .setTitle("🎰 Kết quả Slots 🎰")
            .setDescription(description)
            .addAnimatedImage({
              id: "slots-result",
              imageUrl:
                "https://cdn.mezon.ai/0/1834156727516270592/1805415525119955000/1751356942745_1slots.png",
              positionUrl:
                "https://cdn.mezon.ai/0/1834156727516270592/1827994776956309500/1751357108975_slots.json",
              pool,
              repeat: 3,
              duration: 0.35,
              isResult: true,
              extra: {
                jackpot: 1337517,
              },
            })
        )
      );
    }, 1300);
  }
}
