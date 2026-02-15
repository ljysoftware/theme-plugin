function onLoad() {
  registerPluginActions({
    openThemePicker: function () {
      simpleChat.api.showModal({
        title: 'Select Theme',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Pink', value: 'pink' },
          { label: 'Green', value: 'green' },
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
    ui: {
      toolbarButtons: [
        {
          id: 'themeButton',
          label: 'Theme',
          icon: 'palette',
          action: 'openThemePicker',
        },
      ],
    },
  };
}
