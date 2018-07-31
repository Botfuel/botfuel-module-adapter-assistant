# Google Assistant Adapter for Botfuel

## Installation

In your botfuel project, run :

```shell
npm install --save botfuel-module-adapter-assistant
```

## Set-up

### Botfuel

Create a new config file in the root directory of your project (eg: assistant-config.js)

```javascript
module.exports = {
  adapter: {
    name: 'assistant',
  },
  modules: ['botfuel-module-adapter-assistant']
};
```

### Assistant

In order to make your bot work with the assistant, you need to create an action.json file 

```json
{
  "actions": [
    {
      "description": "Default Welcome Intent",
      "name": "MAIN",
      "fulfillment": {
        "conversationName": "<YOUR_APP_NAME>"
      },
      "intent": {
        "name": "actions.intent.MAIN",
        "trigger": {
          "queryPatterns": [
            "talk to <YOUR_APP_NAME>"
          ]
        }
      }
    }
  ],
  "conversations": {
    "<YOUR_APP_NAME>": {
      "name": "<YOUR_APP_NAME>",
      "url": "<YOUR_BOT_URL>/webhook"
    }
  },
  "locale": "en"
}
```

Once your have this file, you need to deploy it using the `gactions` CLI

```shell
gactions update --action_package action.json --project <YOUR_GOOGLE_ACTIONS_PROJECT_ID>
```

For more info on how to use `gactions`, visit this link <a href="https://developers.google.com/actions/tools/gactions-cli" target="_blank">https://developers.google.com/actions/tools/gactions-cli</a>

## Run your bot

```shell
BOTFUEL_APP_TOKEN=<YOUR_APP_TOKEN> BOTFUEL_APP_ID=<YOUR_APP_TOKEN> BOTFUEL_APP_KEY=<YOUR_APP_TOKEN> npm start assistant-config.js
```