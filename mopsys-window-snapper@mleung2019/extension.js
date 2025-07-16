const { Gio, Meta, Shell } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const KEYBINDINGS = [
  { name: "snap-full", topLeft: [0, 0], size: [1, 1] },
  { name: "snap-left", topLeft: [0, 0], size: [0.5, 1] },
  { name: "snap-right", topLeft: [0.5, 0], size: [0.5, 1] },
  { name: "snap-top-left", topLeft: [0, 0], size: [0.5, 0.5] },
  { name: "snap-top-right", topLeft: [0.5, 0], size: [0.5, 0.5] },
  { name: "snap-bottom-left", topLeft: [0, 0.5], size: [0.5, 0.5] },
  { name: "snap-bottom-right", topLeft: [0.5, 0.5], size: [0.5, 0.5] },
];

let settings;

function moveWindow([xLeft, yTop], [width, height]) {
  let win = global.display.get_focus_window();
  if (!win) return;

  let monitor = win.get_monitor();
  let workArea = Main.layoutManager.getWorkAreaForMonitor(monitor);

  const newX = workArea.x + workArea.width * xLeft;
  const newY = workArea.y + workArea.height * yTop;
  const newW = workArea.width * width;
  const newH = workArea.height * height;

  win.move_resize_frame(false, newX, newY, newW, newH);
}

function init() {
  const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
    Me.path + "/schemas",
    Gio.SettingsSchemaSource.get_default(),
    false
  );
  const schema = schemaSource.lookup(
    "org.mleung2019.mopsys-window-snapper",
    true
  );
  if (!schema) {
    throw new Error(
      "Failed to load schema org.mleung2019.mopsys-window-snapper"
    );
  }
  settings = new Gio.Settings({ settings_schema: schema });
}

function enable() {
  for (const keybind of KEYBINDINGS) {
    Main.wm.addKeybinding(
      keybind.name,
      settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      () => moveWindow(keybind.topLeft, keybind.size)
    );
  }
}

function disable() {
  for (const keybind of KEYBINDINGS) {
    Main.wm.removeKeybinding(keybind.name);
  }
  settings = null;
}
