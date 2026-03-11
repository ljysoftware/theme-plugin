function onLoad() {
  registerPluginActions({
    openThemePicker: function () {
      simpleChat.api.showModal({
        title: 'Select Theme',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
        callback: 'setTheme',
      });
    },
    setTheme: function (theme) {
      simpleChat.api.updateTheme(theme);
    },
  });

  return {
    name: 'Theme Plugin',
    version: '1.0',
  };
}
