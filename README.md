# Colorado News Mapping Project - CMP Version

This project uses [Create React App](https://github.com/facebook/create-react-app). 

## How it works
It has been set up to pull in data from spreadsheets every 6 minutes using Github Actions. You will find it under `.github/workflows/data.yml`. The repository already has the necessary credentials for pulling in the necessary data from Google Sheets.

There are two steps in the process:

- `pullData.js`: This script pulls in the outlet data from the Google sheet. This contains information on news outlets identified by the project, ownership, circulation, coverage area and so on. It also pulls in the results from the news study that shows the originality and locality on the county level.
- `processData.js`: This adds the study data to the map, so it can be displayed on the app.

If you need to make any changes to the text above the map, it needs to be done manually.

## Publishing
The map is a static page with HTML/CSS and Javascript and is published to Github Pages on [this link](https://co-media-project.github.io/news-map/). The task also publishes every 6 minutes, so you don't need to publish it manually.

It is deployed as an iframe, the embed code for which is in `iframe.html`

## Available Scripts

In the project directory, you can run:

### `npm run get-sheet`
Pulls in the data and processes it.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run deploy`

This publishes the new build to [this link](https://co-media-project.github.io/news-map/).
