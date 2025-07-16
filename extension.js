const { Gio, Meta } = imports.gi;
const Main = imports.ui.main;

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

  // Unmaximize window before snapping
  win.unmaximize(Meta.MaximizeFlags.BOTH);

  let monitorIndex = win.get_monitor();
  let workArea = Main.layoutManager.monitors[monitorIndex];

  const newX = workArea.x + workArea.width * xLeft;
  const newY = workArea.y + workArea.height * yTop;
  const newW = workArea.width * width;
  const newH = workArea.height * height;

  win.move_resize_frame(false, newX, newY, newW, newH);
}

function init(metadata) {
  const extensionPath = metadata.path;

  const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
    `${extensionPath}/schemas`,
    Gio.SettingsSchemaSource.get_default(),
    false
  );

  const schema = schemaSource.lookup("org.mleung2019.window-snapper", true);
  settings = new Gio.Settings({ settings_schema: schema });
}

function enable() {
  for (const keybind of KEYBINDINGS) {
    global.display.add_keybinding(
      keybind.name,
      settings,
      Meta.KeyBindingFlags.NONE,
      () => {
        moveWindow(keybind.topLeft, keybind.size);
      }
    );
  }
}

function disable() {
  for (const keybind of KEYBINDINGS) {
    global.display.remove_keybinding(keybind.name);
  }
  settings = null;
}
