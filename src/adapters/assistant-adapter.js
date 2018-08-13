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

const { Adapter } = require('botfuel-dialog');
const {
  Logger,
  UserImageMessage,
  UserTextMessage,
} = require('botfuel-dialog');

const PORT = process.env.PORT || process.env.BOTFUEL_ADAPTER_PORT || 5000;

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
      for (const response of responses) {
        const resp = this.sendResponse(response, conv, conv);
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
        if (!payload.options) { 
          payload.options = {};
        }
        payload.options.question = true;
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

  sendMessage(response, conv, payload) {
    if (payload && payload.options && payload.options.question) {
      conv.ask(response);
    } else {
      conv.close(response);
    }
  }

  adaptText(payload, conv) {
    const response = new SimpleResponse({
      speech: payload.value,
      text: payload.value
    });

    this.sendMessage(response, conv, payload);
  }

  adaptImage(payload, conv) {
    console.log(payload);
    const image = new Image({
      url: payload.value,
    });
    image.accessibility_text = payload.options.accessibility_text;
    
    const response = new BasicCard({
      title: payload.options.accessibility_text,
      image: image
    });

    this.sendMessage(response, conv, payload);
  }

  // TODO
  adaptCards(payload, conv) {

    const items = [];
    for (const card of payload.value) {
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
      }));
  }

  adaptQuickreplies(payload, conv) {
    const response = new Suggestions(...payload.value);
    this.sendMessage(response, conv, payload);
  }
}

module.exports = AssistantAdapter;
