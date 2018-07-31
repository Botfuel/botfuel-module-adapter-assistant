const express = require('express');
const bodyParser = require('body-parser');

const {
  actionssdk,
  SimpleResponse,
  Suggestions,
  BasicCard,
  Image,
  BrowseCarousel,
  BrowseCarouselItem,
} = require('actions-on-google');

const url = require('url');
const { Adapter } = require('botfuel-dialog');
const {
  BotfuelAdapter,
  Logger,
  WebAdapter,
  PostbackMessage,
  UserImageMessage,
  UserTextMessage,
} = require('botfuel-dialog');

// absolute urls to static and template folders
const PORT = process.env.PORT || process.env.BOTFUEL_ADAPTER_PORT || 5000;
const BOT_URL = process.env.BOT_URL || `http://localhost:${PORT}`;
const STATIC_BASE_URL = url.resolve(BOT_URL, 'static/');
const TEMPLATE_BASE_URL = url.resolve(BOT_URL, 'templates/');

let botfuelAdapter = null;

class AssistantAdapter extends Adapter {

  async run() {
    const app = actionssdk();

    app.intent('actions.intent.MAIN', conv => {
      conv.ask('Hi, What can I do for you?');
    });

    app.intent('actions.intent.TEXT', async (conv) => {
      const userMessage = new UserTextMessage(conv.input.raw);

      await super.addUserIfNecessary(conv.user.id);
      const responses = await this.bot.handleMessage(userMessage.toJson(conv.user.id));
      console.log(`${responses.length} responses`);
      for (const response of responses) {
        console.log(`message of type ${response.type}`);
        const resp = this.sendResponse(response, conv);
      }
    });

    express()
      .use(bodyParser.json())
      .use('/webhook', app)
      .use('/static', express.static('src/static'))
      .listen(PORT, () => console.log('run: listening on port', PORT));
  }

  sendResponse(botMessage, conv) {
    const { payload, type } = botMessage;
    switch (type) {
      case 'text':
        return this.adaptText(payload, conv);
      case 'quickreplies':
        return this.adaptQuickreplies(payload, conv);
      case 'image':
        return this.adaptImage(payload, conv);
      case 'actions':
        return this.adaptActions(payload, conv);
      case 'cards':
        return this.adaptCards(payload, conv);
      default:
        return null;
    }
  }

  adaptText(payload, conv) {
    conv.ask(new SimpleResponse({
      speech: payload.value,
      text: payload.value
    }));
  }

  adaptImage(payload, conv) {
    conv.ask(new BasicCard({
      title: '',
      image: new Image({
        url: payload.value,
        alt: '',
        accessibility_text: ''
      }),
    }));
  }

  // TODO
  adaptCards(payload, conv) {

    const items = [];
    for(const card of payload.value) {
      items.push(
        new BrowseCarouselItem({
          title: card.title,
          url: card.url || '',
          description: card.description || '',
          image: new Image({
            url: card.image_url || '',
            alt: '',
          }),
          footer: card.footer || '',
        })
      );
    }
    conv.ask(
      new SimpleResponse({
        speech: "",
        text: ""
      }),
      new BrowseCarousel({
        items: items
        // [
        //   new BrowseCarouselItem({
        //     title: 'Title of item 1',
        //     url: 'https://www.google.com',
        //     description: 'Description of item 1',
        //     image: new Image({
        //       url: 'http://cdn3-www.dogtime.com/assets/uploads/2011/03/puppy-development-460x306.jpg',
        //       alt: 'Image alternate text',
        //     }),
        //     footer: 'Item 1 footer',
        //   }),
        //   new BrowseCarouselItem({
        //     title: 'Title of item 2',
        //     url: 'https://www.github.com',
        //     description: 'Description of item 2',
        //     image: new Image({
        //       url: 'https://www.thehappycatsite.com/wp-content/uploads/2017/10/best-treats-for-kittens.jpg',
        //       alt: 'Google Home',
        //     }),
        //     footer: 'Item 2 footer',
        //   }),
        //   new BrowseCarouselItem({
        //     title: 'Title of item 2',
        //     url: 'https://www.microsoft.com',
        //     description: 'Description of item 2',
        //     image: new Image({
        //       url: 'https://i.redd.it/lwnmll3dsx601.jpg',
        //       alt: 'Google Home',
        //     }),
        //     footer: 'Item 2 footer',
        //   }),
        // ],
      }));
  }

  adaptQuickreplies(payload, conv) {
    conv.ask(new Suggestions(...payload.value));
  }
}

module.exports = AssistantAdapter;
