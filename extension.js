const Settings = imports.ui.settings;
const SignalManager = imports.misc.signalManager;
const Lang = imports.lang;
const { Meta } = imports.gi;
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

class WindowSnapper {
  constructor(metadata) {
    this.metadata = metadata;
  }

  enable() {
    this.settings = new Settings.ExtensionSettings(this, this.metadata.uuid);
    this.signalManager = new SignalManager.SignalManager(null);

    for (const keybind of KEYBINDINGS) {
      this.signalManager.connect(
        this.settings,
        `changed::${keybind.name}`,
        this.updateHotkeys,
        this
      );
    }

    this.registerHotkeys();
  }

  disable() {
    this.removeHotkeys();
    this.signalManager.disconnectAllSignals();
  }

  updateHotkeys() {
    this.removeHotkeys();
    this.registerHotkeys();
  }

  getHotkeySequence(name) {
    let str = this.settings.getValue(name);
    if (str && str.length > 0 && str != "::") {
      return str;
    }
    return null;
  }

  registerHotkeys() {
    for (const keybind of KEYBINDINGS) {
      const combo = this.getHotkeySequence(keybind.name);
      if (combo) {
        Main.keybindingManager.addHotKey(
          keybind.name,
          combo,
          Lang.bind(this, () => {
            moveWindow(keybind.topLeft, keybind.size);
          })
        );
      }
    }
  }

  removeHotkeys() {
    for (const keybind of KEYBINDINGS) {
      Main.keybindingManager.removeHotKey(keybind.name);
    }
  }
}

let extension = null;
function init(metadata) {
  if (!extension) {
    extension = new WindowSnapper(metadata);
  }
}

function enable() {
  extension.enable();
}

function disable() {
  extension.disable();
  extension = null;
}
