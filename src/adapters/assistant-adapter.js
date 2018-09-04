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

const {
  Logger,
  Adapter,
  UserTextMessage,
} = require('botfuel-dialog');

const logger = Logger('AssistantAdapter');

const PORT = process.env.PORT || process.env.BOTFUEL_ADAPTER_PORT || 5000;

class AssistantAdapter extends Adapter {

  async run() {
    logger.debug('run');
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
      .listen(PORT, () => logger.debug('express', `run: listening on port ${PORT}`));
  }

  sendResponse(botMessage, conv) {
    logger.debug('sendResponse', JSON.stringify(botMessage));
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
    logger.debug('sendMessage', JSON.stringify(response));
    logger.debug('sendMessage', JSON.stringify(payload));
    if (payload && payload.options && payload.options.question) {
      conv.ask(...response);
    } else {
      conv.close(...response);
    }
  }

  adaptActions() {
    logger.error('adaptActions: error', 'Not supported');
  }

  adaptText(payload, conv) {
    logger.debug('adaptText', JSON.stringify(payload));
    const response = new SimpleResponse({
      speech: payload.value,
      text: payload.value
    });

    this.sendMessage([response], conv, payload);
  }

  adaptImage(payload, conv) {
    logger.debug('adaptImage', JSON.stringify(payload));
    const image = new Image({
      url: payload.value,
    });
    image.accessibility_text = payload.options.title || payload.options.accessibility_text || '';

    const response = new BasicCard({
      title: payload.options.title || payload.options.accessibility_text || '',
      image: image
    });

    this.sendMessage([response], conv, payload);
  }

  createCard(data) {
    logger.debug('createCard', JSON.stringify(data));
    const urls = data.buttons.filter(i => i.type === 'link');

    if (urls.length < 1) {
      logger.error('createCard: error', 'Cards must have a link');
    }
    const url = urls[0] || '';

    return {
      title: data.title || '',
      url: url.value || '',
      description: data.description || '',
      image: new Image({
        url: data.image_url,
        alt: data.description,
      }),
      footer: data.footer || '',
    }
  }

  adaptCards(payload, conv) {
    logger.debug('adaptImage', JSON.stringify(payload));
    const items = [];
    let response = []

    if (payload.value.length === 1) {

      const card = new BasicCard(this.createCard(payload.value[0]));

      response = [
        new SimpleResponse({
          speech: payload.options.speech || '',
          text: payload.options.text || ''
        }),
        card
      ]
    } else {
      for (const card of payload.value) {
        items.push(
          new BrowseCarouselItem(this.createCard(card))
        );
      }

      response = [
        new SimpleResponse({
          speech: payload.options.speech || '',
          text: payload.options.text || ''
        }),
        new BrowseCarousel({
          items: items
        })
      ]
    }

    this.sendMessage(response, conv, payload);
  }

  adaptQuickreplies(payload, conv) {
    logger.debug('adaptQuickreplies', JSON.stringify(payload));
    const response = new Suggestions(...payload.value);
    this.sendMessage([response], conv, payload);
  }
}

module.exports = AssistantAdapter;