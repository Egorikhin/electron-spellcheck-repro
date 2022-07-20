const { app, BrowserWindow, Menu } = require("electron");

app.on("ready", async () => {
  const mainWindow = new BrowserWindow({ width: 800, height: 600 });

  await mainWindow.loadURL(`file://${__dirname}/index.html`);
  const webContents = mainWindow.webContents;
  const session = webContents.session;

  session.setSpellCheckerLanguages(["en-AU", "ru"]);

  session.on("spellcheck-dictionary-download-begin", (_, lang) => {
    console.log("download begin", lang);
  });
  session.on("spellcheck-dictionary-download-failure", (_, lang) => {
    console.log("download failed", lang);
  });
  session.on("spellcheck-dictionary-download-success", (_, lang) => {
    console.log("download success", lang);
  });
  session.on("spellcheck-dictionary-initialized", (_, lang) => {
    console.log("initialized", lang);
  });

  mainWindow.webContents.on("context-menu", (event, params) => {
    event.preventDefault();
    const { misspelledWord, dictionarySuggestions } = params;
    console.warn(`${misspelledWord} ->`, dictionarySuggestions);

    const isMisspelled = misspelledWord !== "";

    if (isMisspelled) {
      const menu = getContextMenuOptions(
        params,
        mainWindow.webContents,
        dictionarySuggestions
      );

      if (menu) {
        Menu.buildFromTemplate(menu).popup({ window: mainWindow });
      }
    }
  });

  mainWindow.webContents.openDevTools();
});

function getContextMenuOptions(params, webContents, misspellingCorrections) {
  const { selectionText, isEditable } = params;
  const textSelected = selectionText && selectionText.trim() !== "";

  if (isEditable) {
    return getMenuOptions(webContents, misspellingCorrections);
  }

  if (textSelected) {
    return textMenuTemplate;
  }

  return undefined;
}

function getMenuOptions(webContents, misspellingCorrections) {
  if (!misspellingCorrections) {
    return inputMenuTemplate;
  }

  return misspellingCorrections.map((correction) => ({
    label: correction,
    click: () => webContents.replaceMisspelling(correction),
  }));
}
